import * as http from 'http';
import { ParamType } from '../common/types';
import { matchPath } from '../router/path-matcher';
import { parseBody, parseQueryParams, parseCookies, parseFormData } from '../http/request-utils';
import { parseMultipart, MultipartResult } from '../http/multipart-parser';
import { ControllerMetadata } from './metadata-scanner';
import { MiddlewareClass } from '../common/interfaces';
import { extendResponse } from '../http/response';
import { applyCors, CorsOptions } from '../http/cors';
import { ParameterInjector, RequestExecutor, MiddlewareDispatcher } from './handlers';

/**
 * Core HTTP request handler.
 * Orchestrates routing, middleware execution, and request processing.
 */
export class RequestHandler {
    /**
     * Handle incoming HTTP request.
     * Matches routes, executes middlewares, and calls appropriate controller handler.
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

        // Handle OPTIONS requests for CORS preflight
        if (req.method === 'OPTIONS') {
            response.status(204).send('');
            return;
        }

        // Parse URL and extract path
        const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
        const urlPath = parsedUrl.pathname.replace(/\/$/, '') || '/';
        const method = req.method;

        // Try to find matching route
        for (const ctrl of controllers) {
            for (const route of ctrl.routes) {
                const routeParams = matchPath(route.fullPath, urlPath);

                if (routeParams && route.method === method) {
                    try {
                        // Collect all middlewares
                        const ctrlMiddlewares = Reflect.getMetadata('ctrl_middlewares', ctrl.instance.constructor) || [];
                        const routeMiddlewares = Reflect.getMetadata('route_middlewares', ctrl.instance, route.handlerName) || [];
                        const allMiddlewares = [...globalMiddlewares, ...ctrlMiddlewares, ...routeMiddlewares];

                        // Execute middlewares and handler
                        await MiddlewareDispatcher.dispatch(
                            allMiddlewares,
                            req,
                            response,
                            async () => {
                                // Parse request data
                                const queryParams = parseQueryParams(parsedUrl);
                                const cookies = parseCookies(req);
                                let bodyParams = {};
                                let files: MultipartResult['files'] = [];

                                await RequestHandler.parseRequestBody(req, method, bodyParams, files);

                                // Attach files to request
                                (req as any).files = files;

                                // Validate input
                                const schema = Reflect.getMetadata('validation_schema', ctrl.instance, route.handlerName);
                                if (schema) {
                                    const result = schema.safeParse(bodyParams);
                                    if (!result.success) {
                                        response.status(400).json({
                                            status: 400,
                                            error: "Validation Failed",
                                            details: result.error.format()
                                        });
                                        return;
                                    }
                                    bodyParams = result.data;
                                }

                                // Inject parameters and execute handler
                                const args = ParameterInjector.buildArguments(
                                    route.paramsMeta,
                                    req,
                                    response,
                                    bodyParams,
                                    queryParams,
                                    routeParams,
                                    cookies
                                );

                                await RequestExecutor.executeHandler(
                                    ctrl.instance,
                                    route.handlerName,
                                    args,
                                    response
                                );
                            }
                        );
                        return;

                    } catch (e: any) {
                        RequestExecutor.handleError(e, response);
                        return;
                    }
                }
            }
        }

        // Route not found
        RequestExecutor.handle404(response);
    }

    /**
     * Parse request body based on Content-Type.
     * 
     * @param req - HTTP request
     * @param method - HTTP method
     * @param bodyParams - Object to populate with parsed body
     * @param files - Array to populate with uploaded files
     */
    private static async parseRequestBody(
        req: http.IncomingMessage,
        method: string | undefined,
        bodyParams: any,
        files: any[]
    ): Promise<void> {
        if (!['POST', 'PUT', 'PATCH'].includes(method || '')) {
            return;
        }

        const contentType = req.headers['content-type'] || '';

        if (contentType.includes('multipart/form-data')) {
            const multipart = await parseMultipart(req);
            Object.assign(bodyParams, multipart.fields);
            files.push(...multipart.files);
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await parseFormData(req);
            Object.assign(bodyParams, formData);
        } else if (contentType.includes('application/json') || !contentType) {
            const jsonData = await parseBody(req);
            Object.assign(bodyParams, jsonData);
        }
    }
}