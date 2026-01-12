import { globalContainer } from '../../src/lib';

class MockService {
    sayHello() { return 'Hello'; }
}

describe('UNIT - Dependency Injection', () => {

    test('Doit enregistrer et résoudre une classe', () => {
        globalContainer.register(MockService, new MockService());

        const instance = globalContainer.resolve(MockService);
        expect(instance).toBeInstanceOf(MockService);
        expect(instance.sayHello()).toBe('Hello');
    });

    test('Doit retourner la même instance (Singleton)', () => {
        const instance1 = globalContainer.resolve(MockService);
        const instance2 = globalContainer.resolve(MockService);

        expect(instance1).toBe(instance2); // Même référence mémoire
    });

    test('Doit lancer une erreur si service inconnu', () => {
        class UnknownService {}
        expect(() => {
            globalContainer.resolve(UnknownService);
        }).toThrow();
    });
});