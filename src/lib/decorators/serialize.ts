import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';

/**
 * Transform response data using class-transformer DTO.
 * Uses @Expose() decorator to control which properties are included.
 * Excludes all properties by default (excludeExtraneousValues: true).
 * 
 * @param dto - DTO class with @Expose() decorators
 */
export function Serialize(dto: any) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function (...args: any[]) {
            const result = await originalMethod.apply(this, args);
            // Transform result using DTO class (exclude non-exposed properties)
            return plainToInstance(dto, result, { excludeExtraneousValues: true });
        };
        return descriptor;
    };
}
