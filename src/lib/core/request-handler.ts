import * as http from 'http';
import { globalContainer } from '../di/container';
import { ParamType } from '../common/types';
import { matchPath } from '../router/path-matcher';
import { parseBody, parseQueryParams, isJson, parseCookies, parseFormData } from '../http/request-utils';
import { parseMultipart, MultipartResult } from '../http/multipart-parser';
import { ControllerMetadata } from './metadata-scanner';
import { MiddlewareClass, IMiddleware } from '../common/interfaces';
import { extendResponse } from '../http/response';
import { HttpException } from '../common/exceptions';
import { applyCors, CorsOptions } from '../http/cors';

/**
 * Core HTTP request handler.
 * Routes requests to controllers, executes middlewares, handles validation,
 * injects parameters, and manages error responses.
 */
export class RequestHandler {
    /**
     * Handle incoming HTTP request.
     * Matches route, executes middleware chain, validates input, injects parameters,
     * and calls controller handler.
     * 
     * @param req - Incoming HTTP request
     * @param res - HTTP server response
     * @param controllers - All registered controller metadata
     * @param globalMiddlewares - Global middleware classes
     * @param corsOptions - CORS configuration
     */
    static async handle(
        req: http.IncomingMessage,
        res: http.ServerResponse,
        controllers: ControllerMetadata[],
        globalMiddlewares: MiddlewareClass[] = [],
        corsOptions?: CorsOptions
    ) {
        const response = extendResponse(res);
        applyCors(req, response, corsOptions);

        if (req.method === 'OPTIONS') {
            response.status(204).send('');
            return;
        }

        const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
        const urlPath = parsedUrl.pathname.replace(/\/$/, '') || '/';
        const method = req.method;

        for (const ctrl of controllers) {
            for (const route of ctrl.routes) {
                const routeParams = matchPath(route.fullPath, urlPath);

                if (routeParams && route.method === method) {
                    try {
                        const ctrlMiddlewares = Reflect.getMetadata('ctrl_middlewares', ctrl.instance.constructor) || [];
                        const routeMiddlewares = Reflect.getMetadata('route_middlewares', ctrl.instance, route.handlerName) || [];
                        const allMiddlewares = [...globalMiddlewares, ...ctrlMiddlewares, ...routeMiddlewares];

                        const executeHandler = async () => {
                            const queryParams = parseQueryParams(parsedUrl);
                            const cookies = parseCookies(req);
                            let bodyParams = {};
                            let files: MultipartResult['files'] = [];

                            // Parse body based on Content-Type header
                            // Supports: multipart/form-data (file upload), application/x-www-form-urlencoded, application/json
                            if (['POST', 'PUT', 'PATCH'].includes(method || '')) {
                                const contentType = req.headers['content-type'] || '';
                                
                                if (contentType.includes('multipart/form-data')) {
                                    const multipart = await parseMultipart(req);
                                    bodyParams = multipart.fields;
                                    files = multipart.files;
                                } else if (contentType.includes('application/x-www-form-urlencoded')) {
                                    bodyParams = await parseFormData(req);
                                } else if (contentType.includes('application/json') || !contentType) {
                                    bodyParams = await parseBody(req);
                                }
                            }

                            // Attach uploaded files to request for access via @Req()
                            (req as any).files = files;

                            // 🛡️ Input Validation using Zod schema (from @UseValidation decorator)
                            const schema = Reflect.getMetadata('validation_schema', ctrl.instance, route.handlerName);
                            if (schema) {
                                const result = schema.safeParse(bodyParams);
                                if (!result.success) {
                                    // Return validation errors in consistent format
                                    return response.status(400).json({
                                        status: 400,
                                        error: "Validation Failed",
                                        details: result.error.format()
                                    });
                                }
                                // Use validated and type-casted data
                                bodyParams = result.data;
                            }

                            // Parameter injection based on decorators (@Body, @Param, @Query, etc.)
                            let args: any[] = [];
                            if (route.paramsMeta.length > 0) {
                                // Build arguments array from decorator metadata
                                args = new Array(route.paramsMeta.length);
                                route.paramsMeta.forEach((p: any) => {
                                    let val: any = null;
                                    // Resolve value based on parameter type
                                    if (p.type === ParamType.REQ) val = req;
                                    else if (p.type === ParamType.RES) val = response;
                                    else if (p.type === ParamType.BODY) val = bodyParams;
                                    else if (p.type === ParamType.QUERY) val = queryParams;
                                    else if (p.type === ParamType.PARAM) val = routeParams;
                                    else if (p.type === ParamType.COOKIE) val = cookies;

                                    // Extract specific property if key provided (e.g., @Param('id'))
                                    if (p.key && val && typeof val === 'object') args[p.index] = val[p.key];
                                    else args[p.index] = val;
                                });
                            } else {
                                // Auto-merge: if no decorators, merge all params into single object
                                args = [{ ...queryParams, ...bodyParams, ...routeParams }];
                            }

                            // Appel de la méthode du contrôleur
                            const result = await ctrl.instance[route.handlerName](...args);

                            if (response.writableEnded) return;

                            const customHeaders = Reflect.getMetadata('response_headers', ctrl.instance, route.handlerName) || {};
                            Object.keys(customHeaders).forEach(key => response.setHeader(key, customHeaders[key]));

                            const statusCode = Reflect.getMetadata('http_code', ctrl.instance, route.handlerName) || 200;

                            if (typeof result === 'object') response.status(statusCode).json(result);
                            else response.status(statusCode).send(String(result));
                        };

                        // Middleware dispatch chain (Koa-style composition)
                        // Executes: Global -> Controller -> Route middlewares, then handler
                        let index = -1;
                        const dispatch = async (i: number) => {
                            // Prevent calling same middleware twice
                            if (i <= index) return;
                            index = i;

                            // All middlewares executed, call final handler
                            if (i === allMiddlewares.length) {
                                await executeHandler();
                                return;
                            }

                            // Resolve and execute current middleware
                            const MiddlewareClass = allMiddlewares[i];
                            const instance = globalContainer.resolve(MiddlewareClass) as IMiddleware;

                            try {
                                // Call middleware with next() function to continue chain
                                await instance.use(req, response, () => dispatch(i + 1));
                            } catch (err) {
                                throw err;
                            }
                        };

                        await dispatch(0);
                        return;

                    } catch (e: any) {
                        // Error handling: HTTP exceptions, validation errors, and internal errors
                        if (!response.writableEnded) {
                            const status = e.status || 500;
                            const message = isJson(e.message) ? JSON.parse(e.message) : { error: e.message };

                            // Log internal server errors
                            if (status === 500) console.error("🔥 INTERNAL ERROR:", e);

                            // Return standardized error response
                            response.status(status).json({
                                statusCode: status,
                                ...(typeof message === 'object' ? message : { message }),
                                timestamp: new Date().toISOString()
                            });
                        }
                        return;
                    }
                }
            }
        }

        response.status(404).json({ statusCode: 404, error: "Route not found" });
    }
}