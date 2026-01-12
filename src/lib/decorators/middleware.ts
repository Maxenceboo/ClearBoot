import 'reflect-metadata';
import { MiddlewareClass } from '../common/interfaces';

// On force le type MiddlewareClass ici 👇
export function Middleware(...middlewares: MiddlewareClass[]) {
    return (target: any, propertyKey?: string) => {
        if (propertyKey) {
            // Route
            const existing = Reflect.getMetadata('route_middlewares', target, propertyKey) || [];
            Reflect.defineMetadata('route_middlewares', [...existing, ...middlewares], target, propertyKey);
        } else {
            // Controller
            const existing = Reflect.getMetadata('ctrl_middlewares', target) || [];
            Reflect.defineMetadata('ctrl_middlewares', [...existing, ...middlewares], target);
        }
    };
}