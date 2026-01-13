import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';

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
