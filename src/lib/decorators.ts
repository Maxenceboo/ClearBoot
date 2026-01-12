import 'reflect-metadata';
import { ZodSchema } from 'zod';
import { plainToInstance } from 'class-transformer';

export const PROVIDERS_REGISTRY: any[] = [];
export const CONTROLLERS_REGISTRY: any[] = [];

// --- MARQUEURS ---
export function Injectable() {
    return (target: any) => { PROVIDERS_REGISTRY.push(target); };
}
export function Controller(basePath: string = '/') {
    return (target: any) => {
        Reflect.defineMetadata('basePath', basePath, target);
        CONTROLLERS_REGISTRY.push(target);
    };
}

// --- ROUTES (Avec support de l'ordre) ---
function registerRoute(method: string, path: string, order: number, target: any, propertyKey: string) {
    const routes = Reflect.getMetadata('routes', target.constructor) || [];
    routes.push({ method, path, order, handlerName: propertyKey });
    Reflect.defineMetadata('routes', routes, target.constructor);
}

// Par défaut order = 0. Plus le chiffre est grand, plus c'est vérifié tard.
export function Get(path: string = '/', order: number = 0) { return (t: any, k: string) => registerRoute('GET', path, order, t, k); }
export function Post(path: string = '/', order: number = 0) { return (t: any, k: string) => registerRoute('POST', path, order, t, k); }
export function Put(path: string = '/', order: number = 0) { return (t: any, k: string) => registerRoute('PUT', path, order, t, k); }
export function Delete(path: string = '/', order: number = 0) { return (t: any, k: string) => registerRoute('DELETE', path, order, t, k); }
export function Patch(path: string = '/', order: number = 0) { return (t: any, k: string) => registerRoute('PATCH', path, order, t, k); }

// --- PARAMÈTRES (@Body, @Query, @Param) ---
export enum ParamType { BODY = 'BODY', QUERY = 'QUERY', PARAM = 'PARAM' }

function registerParam(type: ParamType, key?: string) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const params = Reflect.getMetadata('route_params', target, propertyKey) || [];
        params.push({ index: parameterIndex, type, key });
        Reflect.defineMetadata('route_params', params, target, propertyKey);
    };
}

export function Body(key?: string) { return registerParam(ParamType.BODY, key); }
export function Query(key?: string) { return registerParam(ParamType.QUERY, key); }
// Alias : @Param dans le code -> ParamType.PARAM en interne
export function Param(key?: string) { return registerParam(ParamType.PARAM, key); }

// --- VALIDATION (Cible le Body) ---
export function Validate(schema: ZodSchema) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('validation_schema', schema, target, propertyKey);
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const paramsMeta = Reflect.getMetadata('route_params', target, propertyKey) || [];
            const bodyParam = paramsMeta.find((p: any) => p.type === ParamType.BODY);

            // Valide l'argument marqué @Body, sinon le premier
            const dataToValidate = bodyParam ? args[bodyParam.index] : args[0];

            const result = schema.safeParse(dataToValidate);
            if (!result.success) {
                throw new Error(JSON.stringify({
                    status: 400, error: "Validation Failed", details: result.error.format()
                }));
            }
            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}

// --- SERIALISATION ---
export function Serialize(dto: any) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            const result = await originalMethod.apply(this, args);
            return plainToInstance(dto, result, { excludeExtraneousValues: true });
        };
        return descriptor;
    };
}