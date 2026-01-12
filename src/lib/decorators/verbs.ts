import 'reflect-metadata';

function registerRoute(method: string, path: string, order: number, target: any, propertyKey: string) {
    const routes = Reflect.getMetadata('routes', target.constructor) || [];
    routes.push({ method, path, order, handlerName: propertyKey });
    Reflect.defineMetadata('routes', routes, target.constructor);
}

export function Get(path: string = '/', order: number = 0) { return (t: any, k: string) => registerRoute('GET', path, order, t, k); }
export function Post(path: string = '/', order: number = 0) { return (t: any, k: string) => registerRoute('POST', path, order, t, k); }
export function Put(path: string = '/', order: number = 0) { return (t: any, k: string) => registerRoute('PUT', path, order, t, k); }
export function Delete(path: string = '/', order: number = 0) { return (t: any, k: string) => registerRoute('DELETE', path, order, t, k); }
export function Patch(path: string = '/', order: number = 0) { return (t: any, k: string) => registerRoute('PATCH', path, order, t, k); }