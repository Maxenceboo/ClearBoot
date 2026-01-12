import 'reflect-metadata';

export type ClassConstructor<T = any> = new (...args: any[]) => T;

class Container {
    private instances = new Map<ClassConstructor, any>();

    register<T>(token: ClassConstructor<T>, instance: T) {
        if (!this.instances.has(token)) {
            this.instances.set(token, instance);
        }
    }

    resolve<T>(token: ClassConstructor<T>): T {
        const instance = this.instances.get(token);
        if (!instance) {
            throw new Error(`❌ Service '${token.name}' introuvable. Avez-vous mis @Injectable() ?`);
        }
        return instance;
    }
}

export const globalContainer = new Container();

export function inject<T>(token: ClassConstructor<T>): T {
    return globalContainer.resolve(token);
}