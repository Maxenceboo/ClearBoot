import * as http from 'http';
import { ClearBoot } from '../../src/lib/index';

describe('INTEGRATION - Configuration & Env', () => {
    let server: http.Server;

    // Sauvegarde des variables avant le test
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules(); // Important pour recharger dotenv si besoin
        process.env = { ...originalEnv }; // Copie propre
    });

    afterEach((done) => {
        if (server) server.close(done);
        process.env = originalEnv; // Restauration
    });

    test('Devrait utiliser le PORT défini dans process.env', () => {
        process.env.PORT = '8888'; // On simule le .env

        server = ClearBoot.create({
            // On ne passe PAS de port ici, ça doit lire l'env
        });

        const address = server.address() as any;
        expect(address.port).toBe(8888);
    });

    test('La config explicite doit être prioritaire sur le .env', () => {
        process.env.PORT = '8888';

        server = ClearBoot.create({
            port: 9999 // Prioritaire
        });

        const address = server.address() as any;
        expect(address.port).toBe(9999);
    });
});