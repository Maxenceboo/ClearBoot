import 'reflect-metadata';
import * as http from 'http';
import { globalContainer } from './container';
import { PROVIDERS_REGISTRY, CONTROLLERS_REGISTRY, ParamType } from './decorators';

export * from './container';
export * from './decorators';

export interface ModuleConfig { port?: number; }

export class ClearBoot {
    static create(config: ModuleConfig) {
        const port = config.port || 3000;
        console.log("\n🚀 Démarrage de ClearBoot (Pro Version)...\n");

        // 1. SERVICES
        PROVIDERS_REGISTRY.forEach(P => globalContainer.register(P, new P()));

        // 2. CONTROLEURS (Tri & Logs)
        const controllersInstances = CONTROLLERS_REGISTRY.map(ControllerClass => {
            const instance = new ControllerClass();
            const basePath = Reflect.getMetadata('basePath', ControllerClass) || '/';
            let routes = Reflect.getMetadata('routes', ControllerClass) || [];

            // ⚡ TRI DES ROUTES PAR PRIORITÉ (Order)
            routes = routes.sort((a: any, b: any) => a.order - b.order);

            console.log(`🎮 \x1b[1m${ControllerClass.name}\x1b[0m`);

            routes.forEach((route: any) => {
                const fullPath = (basePath + route.path).replace('//', '/').replace(/\/$/, '') || '/';
                const paramsMeta = Reflect.getMetadata('route_params', instance, route.handlerName) || [];

                // Affichage personnalisé (@Dyn, @Body...)
                const argsLog = paramsMeta.length > 0
                    ? paramsMeta.map((p:any) => {
                        let label = p.type;
                        if (p.type === ParamType.PARAM) label = 'Dyn';
                        if (p.type === ParamType.BODY) label = 'Body';
                        if (p.type === ParamType.QUERY) label = 'Query';
                        return `\x1b[90m@${label}${p.key ? `('${p.key}')` : ''}\x1b[0m`;
                    }).join(', ')
                    : '\x1b[90m(Auto-Merge)\x1b[0m';

                const orderLog = route.order > 0 ? `\x1b[35m[Order:${route.order}]\x1b[0m` : '';
                console.log(`    ├── ${route.method}\t${fullPath} \t${argsLog} ${orderLog}`);
            });
            console.log('');
            return { instance, basePath, routes };
        });

        // 3. SERVEUR
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

                    // 🧠 MATCHING INTELLIGENT (Regex inclus)
                    const routeParams = matchPath(definedRoutePath, urlPath);

                    if (routeParams && route.method === method) {
                        try {
                            const queryParams = Object.fromEntries(parsedUrl.searchParams.entries());
                            const bodyParams = (['POST', 'PUT', 'PATCH'].includes(method || '')) ? await parseBody(req) : {};

                            const paramsMeta = Reflect.getMetadata('route_params', ctrl.instance, route.handlerName) || [];
                            let args: any[] = [];

                            if (paramsMeta.length > 0) {
                                args = new Array(paramsMeta.length);
                                paramsMeta.forEach((p: any) => {
                                    let val: any = null;
                                    if (p.type === ParamType.BODY) val = bodyParams;
                                    else if (p.type === ParamType.QUERY) val = queryParams;
                                    else if (p.type === ParamType.PARAM) val = routeParams;

                                    // Extraction clé ou objet complet
                                    if (p.key) args[p.index] = val ? val[p.key] : undefined;
                                    else args[p.index] = val;
                                });
                            } else {
                                args = [{ ...queryParams, ...bodyParams, ...routeParams }];
                            }

                            const result = await ctrl.instance[route.handlerName](...args);
                            res.writeHead(200);
                            res.end(JSON.stringify(result));
                            return;

                        } catch (e: any) {
                            res.writeHead(400);
                            const msg = isJson(e.message) ? e.message : JSON.stringify({ error: e.message });
                            res.end(msg);
                            return;
                        }
                    }
                }
            }
            res.writeHead(404);
            res.end(JSON.stringify({ error: "Route not found" }));
        });
        server.listen(config.port || 3000, () => console.log(`🔥 Prêt sur port ${config.port || 3000}`));
    }
}

// --- UTILITAIRES ---
// Matcher avec support Regex :id(\d+)
function matchPath(definedPath: string, currentPath: string): any | null {
    const d = definedPath.split('/').filter(Boolean);
    const c = currentPath.split('/').filter(Boolean);
    if (d.length !== c.length) return null;
    const params: any = {};
    for (let i = 0; i < d.length; i++) {
        const def = d[i], cur = c[i];
        if (def.startsWith(':')) {
            // Regex extraction: :name(regex)
            const matches = def.match(/^:([^\(]+)(\((.*)\))?$/);
            if (matches) {
                const name = matches[1];
                const pattern = matches[3];
                if (pattern) {
                    if (!new RegExp(`^${pattern}$`).test(cur)) return null;
                }
                params[name] = cur;
            }
        } else if (def !== cur) return null;
    }
    return params;
}

function parseBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((r) => {
        let b = ''; req.on('data', c => b += c); req.on('end', () => { try { r(b ? JSON.parse(b) : {}); } catch { r({}); } });
    });
}
function isJson(str: string) { try { JSON.parse(str); return true; } catch { return false; } }