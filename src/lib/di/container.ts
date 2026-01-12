import 'reflect-metadata';

export type ClassConstructor<T = any> = new (...args: any[]) => T;

class Container {
    private instances = new Map<ClassConstructor, any>();

    register<T>(token: ClassConstructor<T>, instance: T) {
        // On garde l'instance si elle n'existe pas déjà (Singleton)
        // Ou on l'écrase si on veut permettre la ré-injection dynamique (utile pour les tests/middlewares)
        this.instances.set(token, instance);
    }

    resolve<T>(token: ClassConstructor<T>): T {
        const instance = this.instances.get(token);

        if (!instance) {
            // 🚨 ICI : On ne tente plus de faire "new token()" magiquement.
            // Si ce n'est pas dans la liste, c'est une erreur !
            throw new Error(`❌ Service '${token.name}' introuvable. Avez-vous mis @Injectable() ou oublié de l'enregistrer ?`);
        }

        return instance;
    }
}

export const globalContainer = new Container();

export function inject<T>(token: ClassConstructor<T>): T {
    return globalContainer.resolve(token);
}