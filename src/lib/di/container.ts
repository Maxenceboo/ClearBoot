import 'reflect-metadata';
import { logger } from '../common/logger';

/** Generic class constructor type */
export type ClassConstructor<T = any> = new (...args: any[]) => T;

/**
 * Simple Dependency Injection Container.
 * Implements Singleton pattern for service instances.
 * Services must be registered via @Injectable() decorator.
 */
class Container {
    /** Singleton instances storage */
    private instances = new Map<ClassConstructor, any>();

    /**
     * Register a service instance in the container.
     * @param token - Service class constructor
     * @param instance - Service instance (singleton)
     */
    register<T>(token: ClassConstructor<T>, instance: T) {
        // Store singleton instance (can override for testing)
        this.instances.set(token, instance);
    }

    /**
     * Resolve (retrieve) a service instance from the container.
     * @param token - Service class constructor
     * @returns Service instance
     * @throws Error if service not registered
     */
    resolve<T>(token: ClassConstructor<T>): T {
        const instance = this.instances.get(token);

        if (!instance) {
            const serviceName = token.name || 'Unknown';
            logger.minimal(`❌ DI Error: Service '${serviceName}' not found. Did you forget @Injectable() decorator?`);
            throw new Error(
                `❌ Service '${serviceName}' not found. Did you forget @Injectable() decorator?`
            );
        }

        return instance;
    }
}

/** Global singleton container instance */
export const globalContainer = new Container();

/**
 * Inject (resolve) a service from the global container.
 * Shorthand for globalContainer.resolve()
 * 
 * @param token - Service class constructor
 * @returns Service instance
 */
export function inject<T>(token: ClassConstructor<T>): T {
    return globalContainer.resolve(token);
}