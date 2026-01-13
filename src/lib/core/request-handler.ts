import * as http from 'http';
import { globalContainer } from '../di/container';
import { ParamType } from '../common/types';
import { matchPath } from '../router/path-matcher';
import { parseBody, parseQueryParams, isJson } from '../http/request-utils';
import { ControllerMetadata } from './metadata-scanner';
import { MiddlewareClass, IMiddleware } from '../common/interfaces';
import { extendResponse } from '../http/response';
import { HttpException } from '../common/exceptions';
import { applyCors, CorsOptions } from '../http/cors'; // 👈 NOUVEL IMPORT

export class RequestHandler {
    static async handle(
        req: http.IncomingMessage,
        res: http.ServerResponse,
        controllers: ControllerMetadata[],
        globalMiddlewares: MiddlewareClass[] = [],
        corsOptions?: CorsOptions // 👈 NOUVEL ARGUMENT
    ) {
        // 1. Transformation de la réponse (Fluent API)
        const response = extendResponse(res);

        // 2. Application de la sécurité CORS (Dynamique)
        // On applique les headers AVANT de traiter quoi que ce soit d'autre
        applyCors(req, response, corsOptions);

        // 3. Gestion du Preflight (OPTIONS)
        // Si c'est une vérification navigateur, on répond OK tout de suite
        if (req.method === 'OPTIONS') {
            response.status(204).send('');
            return;
        }

        // 4. Parsing de l'URL
        const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
        const urlPath = parsedUrl.pathname.replace(/\/$/, '') || '/';
        const method = req.method;

        // 5. Recherche de la Route
        for (const ctrl of controllers) {
            for (const route of ctrl.routes) {
                const routeParams = matchPath(route.fullPath, urlPath);

                if (routeParams && route.method === method) {
                    try {
                        // --- PIPELINE D'EXÉCUTION ---

                        // A. Agrégation des Middlewares
                        const ctrlMiddlewares = Reflect.getMetadata('ctrl_middlewares', ctrl.instance.constructor) || [];
                        const routeMiddlewares = Reflect.getMetadata('route_middlewares', ctrl.instance, route.handlerName) || [];
                        const allMiddlewares = [...globalMiddlewares, ...ctrlMiddlewares, ...routeMiddlewares];

                        // B. Définition du Handler Final (ce qui s'exécute à la fin)
                        const executeHandler = async () => {
                            const queryParams = parseQueryParams(parsedUrl);
                            const bodyParams = (['POST', 'PUT', 'PATCH'].includes(method || '')) ? await parseBody(req) : {};

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

                            // Headers customs définis via @Header
                            const customHeaders = Reflect.getMetadata('response_headers', ctrl.instance, route.handlerName) || {};
                            Object.keys(customHeaders).forEach(key => response.setHeader(key, customHeaders[key]));

                            // Code HTTP défini via @HttpCode
                            const statusCode = Reflect.getMetadata('http_code', ctrl.instance, route.handlerName) || 200;

                            // Envoi de la réponse
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
                            // Instanciation via DI
                            globalContainer.register(MiddlewareClass, new MiddlewareClass());
                            const instance = globalContainer.resolve(MiddlewareClass) as IMiddleware;

                            try {
                                await instance.use(req, response, () => dispatch(i + 1));
                            } catch (err) {
                                throw err;
                            }
                        };

                        // Lancement de la chaîne
                        await dispatch(0);
                        return;

                    } catch (e: any) {
                        // 6. GESTION DES ERREURS (Exception Filters)
                        if (!response.writableEnded) {

                            // Erreur HTTP connue
                            if (e instanceof HttpException) {
                                response.status(e.status).json({
                                    statusCode: e.status,
                                    error: e.message,
                                    timestamp: new Date().toISOString()
                                });
                            }
                            // Erreur de Validation (Zod hack)
                            else if (e.status) {
                                const msg = isJson(e.message) ? JSON.parse(e.message) : { error: e.message };
                                response.status(e.status).json(msg);
                            }
                            // Crash Serveur
                            else {
                                console.error("🔥 INTERNAL SERVER ERROR:", e);
                                response.status(500).json({
                                    statusCode: 500,
                                    error: "Internal Server Error",
                                    message: "Something went wrong"
                                });
                            }
                        }
                        return;
                    }
                }
            }
        }

        // 7. Route non trouvée (404)
        response.status(404).json({
            statusCode: 404,
            error: "Route not found"
        });
    }
}