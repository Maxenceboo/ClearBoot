import 'reflect-metadata';
import { IHeaderProvider } from '../common/interfaces';
import { inject } from '../di/container';

/**
 * Set custom HTTP status code for route response.
 * @param code - HTTP status code (200, 201, 204, etc.)
 * @example
 * @Post()
 * @HttpCode(201)
 * create() { return { id: 1 }; }
 */
export function HttpCode(code: number) {
    return (t: any, k: string) => Reflect.defineMetadata('http_code', code, t, k);
}

/**
 * Apply custom HTTP headers using a header provider class.
 * Provider must implement IHeaderProvider interface.
 * 
 * @param headerClass - Class implementing IHeaderProvider
 * @example
 * @Injectable()
 * class CacheHeaders implements IHeaderProvider {
 *   getHeaders() { return { 'Cache-Control': 'max-age=3600' }; }
 * }
 * 
 * @Get()
 * @Header(CacheHeaders)
 * getData() { return { ... }; }
 */
export function Header(headerClass: any) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            // Inject header provider instance from DI container
            const headerProvider: IHeaderProvider = inject(headerClass);
            
            // Get headers from provider
            const headers = headerProvider.getHeaders();

            // Store headers for request-handler to apply
            Reflect.defineMetadata('response_headers', headers, target, propertyKey);

            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}
