import { ClearBoot } from '../../src/lib/core/application';
import { Controller, Get } from '../../src/lib';
import * as http from 'http';

@Controller('/dummy')
class DummyController {
    @Get('/')
    index() {
        return { ok: true };
    }
}

describe('Lifecycle Hooks', () => {
    let server: http.Server;

    afterEach((done) => {
        if (server) {
            server.close(() => done());
        } else {
            done();
        }
    });

    test('onModuleInit devrait être appelé avant le démarrage', async () => {
        let hookCalled = false;
        let hookCallTime: number = 0;
        let serverStartTime: number;

        server = await ClearBoot.create({
            port: 0,
            onModuleInit: async () => {
                hookCalled = true;
                hookCallTime = Date.now();
                // Simuler une connexion DB
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        });

        serverStartTime = Date.now();

        expect(hookCalled).toBe(true);
        expect(hookCallTime).toBeLessThan(serverStartTime);
    });

    test('onModuleInit peut être asynchrone', async () => {
        let dbConnected = false;

        server = await ClearBoot.create({
            port: 0,
            onModuleInit: async () => {
                // Simuler une vraie connexion DB async
                await new Promise(resolve => setTimeout(resolve, 50));
                dbConnected = true;
            }
        });

        expect(dbConnected).toBe(true);
    });

    test('Le serveur ne démarre pas si onModuleInit échoue', async () => {
        await expect(async () => {
            server = await ClearBoot.create({
                port: 0,
                onModuleInit: async () => {
                    throw new Error('DB Connection Failed');
                }
            });
        }).rejects.toThrow('DB Connection Failed');
    });

    test('onModuleInit est optionnel', async () => {
        server = await ClearBoot.create({
            port: 0
        });

        expect(server).toBeDefined();
        expect(server.listening).toBe(true);
    });
});
