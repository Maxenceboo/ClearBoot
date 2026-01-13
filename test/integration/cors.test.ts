import request from 'supertest';
import * as http from 'http';
import { ClearBoot, Controller, Get } from '../../src/lib/index';

@Controller('/cors-test')
class TestController {
    @Get()
    hello() { return { msg: 'ok' }; }
}

describe('INTEGRATION - CORS Security', () => {
    let server: http.Server;
    const ALLOWED_ORIGIN = 'http://trusted-site.com';

    beforeAll(() => {
        server = ClearBoot.create({
            port: 0,
            cors: {
                origin: [ALLOWED_ORIGIN], // Seul ce site est autorisé
                methods: ['GET', 'POST'],
                credentials: true
            }
        });
    });

    afterAll((done) => {
        server.close(done);
    });

    test('OPTIONS (Preflight) devrait retourner les bons headers', async () => {
        const res = await request(server)
            .options('/cors-test')
            .set('Origin', ALLOWED_ORIGIN)
            .set('Access-Control-Request-Method', 'GET');

        expect(res.status).toBe(204); // No Content
        expect(res.header['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
        expect(res.header['access-control-allow-methods']).toContain('GET');
    });

    test('GET avec une origine autorisée devrait passer', async () => {
        const res = await request(server)
            .get('/cors-test')
            .set('Origin', ALLOWED_ORIGIN);

        expect(res.status).toBe(200);
        expect(res.header['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
        expect(res.header['access-control-allow-credentials']).toBe('true');
    });

    test('GET avec une mauvaise origine ne devrait pas avoir les headers CORS', async () => {
        const res = await request(server)
            .get('/cors-test')
            .set('Origin', 'http://hacker.com');

        expect(res.status).toBe(200); // La requête passe (HTTP standard), mais...
        // ... le navigateur bloquerait la lecture car le header est absent ou incorrect
        expect(res.header['access-control-allow-origin']).toBeUndefined();
    });
});