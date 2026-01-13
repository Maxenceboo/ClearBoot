import * as http from 'http';
import { globalContainer } from '../di/container';
import { ParamType } from '../common/types';
import { matchPath } from '../router/path-matcher';
import { parseBody, parseQueryParams, isJson } from '../http/request-utils';
import { ControllerMetadata } from './metadata-scanner';
import { MiddlewareClass, IMiddleware } from '../common/interfaces';
import { extendResponse } from '../http/response';
import { HttpException } from '../common/exceptions';
import { applyCors, CorsOptions } from '../http/cors';

export class RequestHandler {
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
                            let bodyParams = (['POST', 'PUT', 'PATCH'].includes(method || '')) ? await parseBody(req) : {};

                            // --- 🛡️ LOGIQUE DE VALIDATION (Lien avec ton décorateur dans features) ---
                            const schema = Reflect.getMetadata('validation_schema', ctrl.instance, route.handlerName);
                            if (schema) {
                                const result = schema.safeParse(bodyParams);
                                if (!result.success) {
                                    // On utilise le format d'erreur de ton décorateur pour la cohérence
                                    return response.status(400).json({
                                        status: 400,
                                        error: "Validation Failed",
                                        details: result.error.format()
                                    });
                                }
                                bodyParams = result.data; // On injecte les données castées par Zod
                            }

                            // Injection des paramètres (@Body, @Param, etc.)
                            let args: any[] = [];
                            if (route.paramsMeta.length > 0) {
                                args = new Array(route.paramsMeta.length);
                                route.paramsMeta.forEach((p: any) => {
                                    let val: any = null;
                                    if (p.type === ParamType.REQ) val = req;
                                    else if (p.type === ParamType.RES) val = response;
                                    else if (p.type === ParamType.BODY) val = bodyParams;
                                    else if (p.type === ParamType.QUERY) val = queryParams;
                                    else if (p.type === ParamType.PARAM) val = routeParams;

                                    if (p.key && val && typeof val === 'object') args[p.index] = val[p.key];
                                    else args[p.index] = val;
                                });
                            } else {
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

                        // C. Dispatcher des Middlewares
                        let index = -1;
                        const dispatch = async (i: number) => {
                            if (i <= index) return;
                            index = i;

                            if (i === allMiddlewares.length) {
                                await executeHandler();
                                return;
                            }

                            const MiddlewareClass = allMiddlewares[i];
                            const instance = globalContainer.resolve(MiddlewareClass) as IMiddleware;

                            try {
                                await instance.use(req, response, () => dispatch(i + 1));
                            } catch (err) {
                                throw err;
                            }
                        };

                        await dispatch(0);
                        return;

                    } catch (e: any) {
                        if (!response.writableEnded) {
                            // Gestion des erreurs HTTP et Validation
                            const status = e.status || 500;
                            const message = isJson(e.message) ? JSON.parse(e.message) : { error: e.message };

                            if (status === 500) console.error("🔥 INTERNAL ERROR:", e);

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