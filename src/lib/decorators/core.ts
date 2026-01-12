import 'reflect-metadata';
import { PROVIDERS_REGISTRY, CONTROLLERS_REGISTRY } from '../common/types';

export function Injectable() {
    return (target: any) => { PROVIDERS_REGISTRY.push(target); };
}

export function Controller(basePath: string = '/') {
    return (target: any) => {
        Reflect.defineMetadata('basePath', basePath, target);
        CONTROLLERS_REGISTRY.push(target);
    };
}