import 'reflect-metadata';
import { ZodSchema } from 'zod';
import { plainToInstance } from 'class-transformer';
import { ParamType } from '../common/types';

export function HttpCode(code: number) { return (t: any, k: string) => Reflect.defineMetadata('http_code', code, t, k); }
export function Header(key: string, value: string) { return (t: any, k: string) => { const h = Reflect.getMetadata('response_headers', t, k) || {}; h[key] = value; Reflect.defineMetadata('response_headers', h, t, k); }; }

export function Validate(schema: ZodSchema) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('validation_schema', schema, target, propertyKey);
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            const paramsMeta = Reflect.getMetadata('route_params', target, propertyKey) || [];
            const bodyParam = paramsMeta.find((p: any) => p.type === ParamType.BODY);
            const dataToValidate = bodyParam ? args[bodyParam.index] : args[0];
            const result = schema.safeParse(dataToValidate);
            if (!result.success) throw new Error(JSON.stringify({ status: 400, error: "Validation Failed", details: result.error.format() }));
            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}

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