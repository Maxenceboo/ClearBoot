import 'reflect-metadata';
import { ZodSchema } from 'zod';
import { ParamType } from '../common/types';

/**
 * Validate request data using Zod schema.
 * Automatically validates @Body parameter (or first argument if no decorators).
 * Returns 400 Bad Request with validation errors on failure.
 * 
 * @param schema - Zod validation schema
 */
export function Validate(schema: ZodSchema) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // Store schema for request-handler to use
        Reflect.defineMetadata('validation_schema', schema, target, propertyKey);
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            // Find @Body parameter or use first argument
            const paramsMeta = Reflect.getMetadata('route_params', target, propertyKey) || [];
            const bodyParam = paramsMeta.find((p: any) => p.type === ParamType.BODY);
            const dataToValidate = bodyParam ? args[bodyParam.index] : args[0];

            // Validate data with Zod schema
            const result = schema.safeParse(dataToValidate);

            if (!result.success) {
                // Format validation error response
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
