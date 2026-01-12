import * as http from 'http';
import { globalContainer } from '../di/container';
import { ParamType } from '../common/types';
import { matchPath } from '../router/path-matcher';
import { parseBody, parseQueryParams, isJson } from '../http/request-utils';
import { ControllerMetadata } from './metadata-scanner';
import { MiddlewareClass, IMiddleware } from '../common/interfaces';
import { extendResponse, ClearResponse } from '../http/response';

export class RequestHandler {
    static async handle(
        req: http.IncomingMessage,
        res: http.ServerResponse,
        controllers: ControllerMetadata[],
        globalMiddlewares: MiddlewareClass[] = []
    ) {
        // TRANSFORMATION IMMÉDIATE DU 'RES'
        const response = extendResponse(res);

        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Access-Control-Allow-Origin', '*');

        // Utilisation de la nouvelle syntaxe pour le preflight CORS
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
                            const bodyParams = (['POST', 'PUT', 'PATCH'].includes(method || '')) ? await parseBody(req) : {};

                            let args: any[] = [];
                            if (route.paramsMeta.length > 0) {
                                args = new Array(route.paramsMeta.length);
                                route.paramsMeta.forEach((p: any) => {
                                    let val: any = null;
                                    if (p.type === ParamType.REQ) val = req;
                                    else if (p.type === ParamType.RES) val = response; // 👈 Injection du super response
                                    else if (p.type === ParamType.BODY) val = bodyParams;
                                    else if (p.type === ParamType.QUERY) val = queryParams;
                                    else if (p.type === ParamType.PARAM) val = routeParams;

                                    if (p.key && val && typeof val === 'object') args[p.index] = val[p.key];
                                    else args[p.index] = val;
                                });
                            } else {
                                args = [{ ...queryParams, ...bodyParams, ...routeParams }];
                            }

                            const result = await ctrl.instance[route.handlerName](...args);

                            if (response.writableEnded) return;

                            const customHeaders = Reflect.getMetadata('response_headers', ctrl.instance, route.handlerName) || {};
                            Object.keys(customHeaders).forEach(key => response.setHeader(key, customHeaders[key]));

                            const statusCode = Reflect.getMetadata('http_code', ctrl.instance, route.handlerName) || 200;

                            // 👇 UTILISATION DE LA NOUVELLE SYNTAXE POUR LA RÉPONSE FINALE
                            if (typeof result === 'object') response.status(statusCode).json(result);
                            else response.status(statusCode).send(String(result));
                        };

                        let index = -1;
                        const dispatch = async (i: number) => {
                            if (i <= index) return;
                            index = i;

                            if (i === allMiddlewares.length) {
                                await executeHandler();
                                return;
                            }

                            const MiddlewareClass = allMiddlewares[i];
                            globalContainer.register(MiddlewareClass, new MiddlewareClass());
                            const instance = globalContainer.resolve(MiddlewareClass) as IMiddleware;

                            try {
                                // 👇 PASSAGE DU SUPER RESPONSE AU MIDDLEWARE
                                await instance.use(req, response, () => dispatch(i + 1));
                            } catch (err) {
                                throw err;
                            }
                        };

                        await dispatch(0);
                        return;

                    } catch (e: any) {
                        if (!response.writableEnded) {
                            // 👇 GESTION ERREUR AVEC NOUVELLE SYNTAXE
                            const status = e.status || 500;
                            const msg = isJson(e.message) ? JSON.parse(e.message) : { error: e.message };
                            response.status(status).json(msg);
                        }
                        return;
                    }
                }
            }
        }
        // 404 Not Found
        response.status(404).json({ error: "Route not found" });
    }
}