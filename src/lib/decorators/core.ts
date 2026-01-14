import 'reflect-metadata';
import { PROVIDERS_REGISTRY, CONTROLLERS_REGISTRY } from '../common/types';

/**
 * Mark a class as injectable service (singleton).
 * Registers the service in the DI container.
 * 
 * @example
 * @Injectable()
 * class UserService {
 *   findAll() { return ['Alice', 'Bob']; }
 * }
 */
export function Injectable() {
    return (target: any) => { 
        PROVIDERS_REGISTRY.push(target); 
    };
}

/**
 * Mark a class as HTTP controller.
 * Registers the controller and defines its base path.
 * 
 * @param basePath - Base path for all routes in this controller (default: '/')
 * 
 * @example
 * @Controller('/users')
 * class UserController {
 *   @Get('/') getAll() { return ['Alice', 'Bob']; }
 * }
 */
export function Controller(basePath: string = '/') {
    return (target: any) => {
        Reflect.defineMetadata('basePath', basePath, target);
        CONTROLLERS_REGISTRY.push(target);
    };
}