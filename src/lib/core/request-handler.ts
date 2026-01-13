import * as http from 'http';
import { globalContainer } from '../di/container';
import { ParamType } from '../common/types';
import { matchPath } from '../router/path-matcher';
import { parseBody, parseQueryParams, isJson } from '../http/request-utils';
import { ControllerMetadata } from './metadata-scanner';
import { MiddlewareClass, IMiddleware } from '../common/interfaces';
import { extendResponse, ClearResponse } from '../http/response';
import { HttpException } from '../common/exceptions';

export class RequestHandler {
    static async handle(
        req: http.IncomingMessage,
        res: http.ServerResponse,
        controllers: ControllerMetadata[],
        globalMiddlewares: MiddlewareClass[] = []
    ) {
        // 1. Transformation de la réponse native en réponse "Fluent"
        const response = extendResponse(res);

        response.setHeader('Content-Type', 'application/json');
        response.setHeader('Access-Control-Allow-Origin', '*');

        // Gestion du Preflight CORS
        if (req.method === 'OPTIONS') {
            response.status(204).send('');
            return;
        }

        const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
        const urlPath = parsedUrl.pathname.replace(/\/$/, '') || '/';
        const method = req.method;

        // 2. Recherche de la route correspondante
        for (const ctrl of controllers) {
            for (const route of ctrl.routes) {
                const routeParams = matchPath(route.fullPath, urlPath);

                if (routeParams && route.method === method) {
                    try {
                        // 3. Agrégation des Middlewares (Global -> Controller -> Route)
                        const ctrlMiddlewares = Reflect.getMetadata('ctrl_middlewares', ctrl.instance.constructor) || [];
                        const routeMiddlewares = Reflect.getMetadata('route_middlewares', ctrl.instance, route.handlerName) || [];

                        // L'ordre est crucial : d'abord les globaux, puis ceux du ctrl, puis ceux de la route
                        const allMiddlewares = [...globalMiddlewares, ...ctrlMiddlewares, ...routeMiddlewares];

                        // 4. Définition du Handler final (ce qui s'exécute après les middlewares)
                        const executeHandler = async () => {
                            const queryParams = parseQueryParams(parsedUrl);
                            const bodyParams = (['POST', 'PUT', 'PATCH'].includes(method || '')) ? await parseBody(req) : {};

                            // Injection des paramètres (@Body, @Param, @Req, etc.)
                            let args: any[] = [];
                            if (route.paramsMeta.length > 0) {
                                args = new Array(route.paramsMeta.length);
                                route.paramsMeta.forEach((p: any) => {
                                    let val: any = null;
                                    if (p.type === ParamType.REQ) val = req;
                                    else if (p.type === ParamType.RES) val = response; // On injecte la réponse améliorée
                                    else if (p.type === ParamType.BODY) val = bodyParams;
                                    else if (p.type === ParamType.QUERY) val = queryParams;
                                    else if (p.type === ParamType.PARAM) val = routeParams;

                                    if (p.key && val && typeof val === 'object') args[p.index] = val[p.key];
                                    else args[p.index] = val;
                                });
                            } else {
                                // Fallback si pas de décorateurs de params
                                args = [{ ...queryParams, ...bodyParams, ...routeParams }];
                            }

                            // Exécution de la méthode du contrôleur
                            const result = await ctrl.instance[route.handlerName](...args);

                            if (response.writableEnded) return;

                            // Gestion des headers spécifiques à la route
                            const customHeaders = Reflect.getMetadata('response_headers', ctrl.instance, route.handlerName) || {};
                            Object.keys(customHeaders).forEach(key => response.setHeader(key, customHeaders[key]));

                            // Gestion du Status Code
                            const statusCode = Reflect.getMetadata('http_code', ctrl.instance, route.handlerName) || 200;

                            // Envoi de la réponse finale
                            if (typeof result === 'object') response.status(statusCode).json(result);
                            else response.status(statusCode).send(String(result));
                        };

                        // 5. Dispatcher récursif des Middlewares
                        let index = -1;
                        const dispatch = async (i: number) => {
                            if (i <= index) return;
                            index = i;

                            // Si on a fini les middlewares, on lance le handler
                            if (i === allMiddlewares.length) {
                                await executeHandler();
                                return;
                            }

                            const MiddlewareClass = allMiddlewares[i];

                            // On enregistre (au cas où) et on résout via DI pour avoir les injections
                            globalContainer.register(MiddlewareClass, new MiddlewareClass());
                            const instance = globalContainer.resolve(MiddlewareClass) as IMiddleware;

                            try {
                                // On appelle le middleware en lui passant 'next' qui est dispatch(i + 1)
                                await instance.use(req, response, () => dispatch(i + 1));
                            } catch (err) {
                                throw err; // On remonte l'erreur au catch global
                            }
                        };

                        // Lancement de la chaîne
                        await dispatch(0);
                        return;

                    } catch (e: any) {
                        // 6. GESTION GLOBALE DES ERREURS (Exception Filters)
                        if (!response.writableEnded) {

                            // Cas A : Erreur Http connue (NotFoundException, ForbiddenException...)
                            if (e instanceof HttpException) {
                                response.status(e.status).json({
                                    statusCode: e.status,
                                    error: e.message,
                                    timestamp: new Date().toISOString()
                                });
                            }
                            // Cas B : Erreur de Validation Zod (hack avec e.status)
                            else if (e.status) {
                                const msg = isJson(e.message) ? JSON.parse(e.message) : { error: e.message };
                                response.status(e.status).json(msg);
                            }
                            // Cas C : Erreur Serveur inconnue (Crash)
                            else {
                                console.error("🔥 INTERNAL SERVER ERROR:", e);
                                response.status(500).json({
                                    statusCode: 500,
                                    error: "Internal Server Error",
                                    message: "Something went wrong on the server"
                                });
                            }
                        }
                        return;
                    }
                }
            }
        }

        // 7. Aucune route trouvée (404 par défaut)
        response.status(404).json({
            statusCode: 404,
            error: "Route not found"
        });
    }
}