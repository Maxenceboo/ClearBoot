import 'reflect-metadata';
import * as http from 'http';
import { globalContainer } from '../di/container';
import { PROVIDERS_REGISTRY, CONTROLLERS_REGISTRY, ParamType } from '../common/types';
import { matchPath } from '../router/path-matcher';
import { parseBody, parseQueryParams, isJson } from '../http/request-utils';

export interface ModuleConfig { port?: number; }

export class ClearBoot {
    static create(config: ModuleConfig) {
        const port = config.port || 3000;
        console.log("\n🚀 Démarrage de ClearBoot (Clean Architecture)...\n");

        // 1. Initialisation des Services
        PROVIDERS_REGISTRY.forEach(P => globalContainer.register(P, new P()));

        // 2. Initialisation des Contrôleurs
        const controllersInstances = CONTROLLERS_REGISTRY.map(ControllerClass => {
            const instance = new ControllerClass();
            const basePath = Reflect.getMetadata('basePath', ControllerClass) || '/';
            let routes = Reflect.getMetadata('routes', ControllerClass) || [];

            // Tri des routes par ordre
            routes = routes.sort((a: any, b: any) => a.order - b.order);

            // Logging propre
            console.log(`🎮 \x1b[1m${ControllerClass.name}\x1b[0m`);
            routes.forEach((route: any) => {
                const fullPath = (basePath + route.path).replace('//', '/').replace(/\/$/, '') || '/';
                const paramsMeta = Reflect.getMetadata('route_params', instance, route.handlerName) || [];
                const argsLog = paramsMeta.length > 0
                    ? paramsMeta.map((p:any) => `\x1b[90m@${p.type}${p.key ? `('${p.key}')` : ''}\x1b[0m`).join(', ')
                    : '\x1b[90m(Auto-Merge)\x1b[0m';
                const orderLog = route.order > 0 ? `\x1b[35m[Order:${route.order}]\x1b[0m` : '';
                console.log(`    ├── ${route.method}\t${fullPath} \t${argsLog} ${orderLog}`);
            });
            console.log('');
            return { instance, basePath, routes };
        });

        // 3. Création du Serveur
        const server = http.createServer(async (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

            const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
            const urlPath = parsedUrl.pathname.replace(/\/$/, '') || '/';
            const method = req.method;

            for (const ctrl of controllersInstances) {
                for (const route of ctrl.routes) {
                    const definedRoutePath = (ctrl.basePath + route.path).replace('//', '/').replace(/\/$/, '') || '/';

                    // Vérification du Path (Regex inclus)
                    const routeParams = matchPath(definedRoutePath, urlPath);

                    if (routeParams && route.method === method) {
                        try {
                            // Extraction des données (déléguée aux utilitaires)
                            const queryParams = parseQueryParams(parsedUrl);
                            const bodyParams = (['POST', 'PUT', 'PATCH'].includes(method || '')) ? await parseBody(req) : {};

                            // Construction des arguments
                            const paramsMeta = Reflect.getMetadata('route_params', ctrl.instance, route.handlerName) || [];
                            let args: any[] = [];

                            if (paramsMeta.length > 0) {
                                args = new Array(paramsMeta.length);
                                paramsMeta.forEach((p: any) => {
                                    let val: any = null;
                                    if (p.type === ParamType.REQ) val = req;
                                    else if (p.type === ParamType.RES) val = res;
                                    else if (p.type === ParamType.BODY) val = bodyParams;
                                    else if (p.type === ParamType.QUERY) val = queryParams;
                                    else if (p.type === ParamType.PARAM) val = routeParams;

                                    if (p.key && val && typeof val === 'object') args[p.index] = val[p.key];
                                    else args[p.index] = val;
                                });
                            } else {
                                args = [{ ...queryParams, ...bodyParams, ...routeParams }];
                            }

                            // Exécution
                            const result = await ctrl.instance[route.handlerName](...args);

                            // Gestion de la réponse
                            if (res.writableEnded) return;

                            const customHeaders = Reflect.getMetadata('response_headers', ctrl.instance, route.handlerName) || {};
                            Object.keys(customHeaders).forEach(key => res.setHeader(key, customHeaders[key]));

                            const statusCode = Reflect.getMetadata('http_code', ctrl.instance, route.handlerName) || 200;
                            res.writeHead(statusCode);

                            if (typeof result === 'object') res.end(JSON.stringify(result));
                            else res.end(String(result));
                            return;

                        } catch (e: any) {
                            if (!res.writableEnded) {
                                res.writeHead(400);
                                const msg = isJson(e.message) ? e.message : JSON.stringify({ error: e.message });
                                res.end(msg);
                            }
                            return;
                        }
                    }
                }
            }
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Route not found" }));
        });

        if (config.port) {
            server.listen(config.port, () => {
                console.log(`🔥 Prêt sur port ${config.port}`);
            });
        }
        return server;
    }
}