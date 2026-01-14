import 'reflect-metadata';
import { MiddlewareClass } from '../common/interfaces';

/**
 * Attach middleware(s) to controller or specific route.
 * Applied only to decorated controller or route, not globally.
 * Executed before route handler, after global middlewares.
 * 
 * @param middlewares - One or more middleware classes implementing IMiddleware
 * 
 */
export function Middleware(...middlewares: MiddlewareClass[]) {
    return (target: any, propertyKey?: string) => {
        if (propertyKey) {
            // Route-level middleware (propertyKey = method name)
            const existing = Reflect.getMetadata('route_middlewares', target, propertyKey) || [];
            Reflect.defineMetadata('route_middlewares', [...existing, ...middlewares], target, propertyKey);
        } else {
            // Controller-level middleware
            const existing = Reflect.getMetadata('ctrl_middlewares', target) || [];
            Reflect.defineMetadata('ctrl_middlewares', [...existing, ...middlewares], target);
        }
    };
}