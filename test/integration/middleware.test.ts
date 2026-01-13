import request from 'supertest';
import * as http from 'http';
import {
    ClearBoot, Controller, Get, Middleware, Injectable
} from '../../src/lib/index';
import { IMiddleware } from '../../src/lib/common/interfaces';
import { ClearResponse } from '../../src/lib/http/response';

// --- 1. MOCKS (Faux composants pour le test) ---

// Middleware Global : Ajoute un header
@Injectable()
class GlobalTagMiddleware implements IMiddleware {
    use(req: http.IncomingMessage, res: ClearResponse, next: () => void) {
        res.setHeader('X-Global-Tag', 'Present');
        next();
    }
}

// Middleware Bloquant : Utilise la nouvelle syntaxe status().json()
@Injectable()
class BlockMiddleware implements IMiddleware {
    use(req: http.IncomingMessage, res: ClearResponse, next: () => void) {
        // On bloque tout ici
        res.status(403).json({ error: "Interdit par le Middleware" });
    }
}

// Contrôleur de test
@Controller('/test-mw')
class MiddlewareController {

    @Get('/public')
    publicRoute() {
        return { message: "Success" };
    }

    @Get('/protected')
    @Middleware(BlockMiddleware) // 👈 Doit bloquer l'accès
    protectedRoute() {
        return { message: "Tu ne devrais pas voir ça" };
    }
}

// --- 2. SUITE DE TEST JEST ---

describe('INTEGRATION - Middlewares System', () => {
    let server: http.Server;

    beforeAll(async () => {
        // On démarre une instance fraîche de l'app
        server = await ClearBoot.create({
            port: 0, // Port aléatoire
            globalMiddlewares: [GlobalTagMiddleware]
        });
    });

    afterAll((done) => {
        server.close(done);
    });

    test('DOIT exécuter le middleware global (Header présent)', async () => {
        const res = await request(server).get('/test-mw/public');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ message: "Success" });
        // Vérifie que le global a fait son travail
        expect(res.header['x-global-tag']).toBe('Present');
    });

    test('DOIT bloquer la route et utiliser res.status().json()', async () => {
        const res = await request(server).get('/test-mw/protected');

        // Vérifie que le BlockMiddleware a pris le dessus
        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: "Interdit par le Middleware" });
        // Le global doit quand même avoir tourné avant
        expect(res.header['x-global-tag']).toBe('Present');
    });
});