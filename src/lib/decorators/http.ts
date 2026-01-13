import 'reflect-metadata';
import { IHeaderProvider } from '../common/interfaces';
import { inject } from '../di/container';

export function HttpCode(code: number) {
    return (t: any, k: string) => Reflect.defineMetadata('http_code', code, t, k);
}

export function Header(headerClass: any) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            // Injecter l'instance de la classe
            const headerProvider: IHeaderProvider = inject(headerClass);
            
            // Appeler la méthode pour obtenir les headers
            const headers = headerProvider.getHeaders();

            // Stocker les headers pour que request-handler les applique
            Reflect.defineMetadata('response_headers', headers, target, propertyKey);

            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}
