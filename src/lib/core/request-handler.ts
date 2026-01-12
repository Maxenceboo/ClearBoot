import * as http from 'http';
import { ParamType } from '../common/types';
import { matchPath } from '../router/path-matcher';
import { parseBody, parseQueryParams, isJson } from '../http/request-utils';
import { ControllerMetadata } from './metadata-scanner';

export class RequestHandler {
    static async handle(req: http.IncomingMessage, res: http.ServerResponse, controllers: ControllerMetadata[]) {
        // Headers CORS et JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

        const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
        const urlPath = parsedUrl.pathname.replace(/\/$/, '') || '/';
        const method = req.method;

        for (const ctrl of controllers) {
            for (const route of ctrl.routes) {

                // Matching
                const routeParams = matchPath(route.fullPath, urlPath);

                if (routeParams && route.method === method) {
                    try {
                        // Extraction
                        const queryParams = parseQueryParams(parsedUrl);
                        const bodyParams = (['POST', 'PUT', 'PATCH'].includes(method || '')) ? await parseBody(req) : {};

                        // Construction Arguments
                        let args: any[] = [];
                        if (route.paramsMeta.length > 0) {
                            args = new Array(route.paramsMeta.length);
                            route.paramsMeta.forEach((p: any) => {
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

                        // Réponse
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
    }
}