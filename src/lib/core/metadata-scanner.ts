import 'reflect-metadata';
import { CONTROLLERS_REGISTRY, ParamType } from '../common/types';

export interface RouteDefinition {
    method: string;
    path: string;
    fullPath: string;
    handlerName: string;
    order: number;
    paramsMeta: any[];
}

export interface ControllerMetadata {
    instance: any;
    basePath: string;
    routes: RouteDefinition[];
}

export class MetadataScanner {
    static scan(): ControllerMetadata[] {
        return CONTROLLERS_REGISTRY.map(ControllerClass => {
            const instance = new ControllerClass();
            const basePath = Reflect.getMetadata('basePath', ControllerClass) || '/';
            let routes = Reflect.getMetadata('routes', ControllerClass) || [];

            // Tri
            routes = routes.sort((a: any, b: any) => a.order - b.order);

            // Log
            console.log(`🎮 \x1b[1m${ControllerClass.name}\x1b[0m`);

            const processedRoutes = routes.map((route: any) => {
                const fullPath = (basePath + route.path).replace('//', '/').replace(/\/$/, '') || '/';
                const paramsMeta = Reflect.getMetadata('route_params', instance, route.handlerName) || [];

                // Affichage console
                const argsLog = paramsMeta.length > 0
                    ? paramsMeta.map((p:any) => `\x1b[90m@${p.type}\x1b[0m`).join(', ')
                    : '\x1b[90m(Auto-Merge)\x1b[0m';
                const orderLog = route.order > 0 ? `\x1b[35m[Order:${route.order}]\x1b[0m` : '';
                console.log(`    ├── ${route.method}\t${fullPath} \t${argsLog} ${orderLog}`);

                return { ...route, fullPath, paramsMeta };
            });
            console.log('');

            return { instance, basePath, routes: processedRoutes };
        });
    }
}