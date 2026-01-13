import 'reflect-metadata';
import { ZodSchema } from 'zod';
import { ParamType } from '../common/types';

export function Validate(schema: ZodSchema) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        Reflect.defineMetadata('validation_schema', schema, target, propertyKey);
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const paramsMeta = Reflect.getMetadata('route_params', target, propertyKey) || [];
            const bodyParam = paramsMeta.find((p: any) => p.type === ParamType.BODY);
            const dataToValidate = bodyParam ? args[bodyParam.index] : args[0];

            const result = schema.safeParse(dataToValidate);

            if (!result.success) {
                const errorData = {
                    status: 400,
                    error: "Validation Failed",
                    details: result.error.format()
                };

                const err: any = new Error(JSON.stringify(errorData));
                err.status = 400;
                throw err;
            }

            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}
