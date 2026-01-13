import request from 'supertest';
import * as http from 'http';
import { ClearBoot, Controller, Get, Post, Cookie, Res } from '../../src/lib/index';
import { ClearResponse } from '../../src/lib/http/response';

@Controller('/cookies')
class CookieController {
    @Get('/read')
    readCookie(@Cookie('session') session: string, @Cookie() allCookies: Record<string, string>) {
        return { session, all: allCookies };
    }

    @Post('/set')
    setCookie(@Res() res: ClearResponse) {
        res.cookie('session', 'abc123', { httpOnly: true, maxAge: 3600000 });
        res.cookie('user', 'maxence', { path: '/' });
        return res.json({ set: true });
    }

    @Post('/clear')
    clearCookie(@Res() res: ClearResponse) {
        res.clearCookie('session');
        return res.json({ cleared: true });
    }
}

describe('INTEGRATION - Cookies', () => {
    let server: http.Server;

    beforeAll(async () => {
        server = await ClearBoot.create({ port: 0 });
    });

    afterAll((done) => {
        server.close(done);
    });

    test('GET /cookies/read - devrait lire les cookies', async () => {
        const res = await request(server)
            .get('/cookies/read')
            .set('Cookie', 'session=abc123; user=maxence');

        expect(res.status).toBe(200);
        expect(res.body.session).toBe('abc123');
        expect(res.body.all).toEqual({ session: 'abc123', user: 'maxence' });
    });

    test('GET /cookies/read - devrait retourner undefined si pas de cookie', async () => {
        const res = await request(server).get('/cookies/read');

        expect(res.status).toBe(200);
        expect(res.body.session).toBeUndefined();
        expect(res.body.all).toEqual({});
    });

    test('POST /cookies/set - devrait définir des cookies', async () => {
        const res = await request(server).post('/cookies/set');

        expect(res.status).toBe(200);
        expect(res.body.set).toBe(true);
        
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        expect(Array.isArray(cookies)).toBe(true);
        
        if (Array.isArray(cookies)) {
            expect(cookies.length).toBe(2);
            const sessionCookie = cookies.find((c: string) => c.startsWith('session='));
            expect(sessionCookie).toContain('HttpOnly');
            expect(sessionCookie).toContain('Max-Age=3600');
        }
    });

    test('POST /cookies/clear - devrait supprimer un cookie', async () => {
        const res = await request(server).post('/cookies/clear');

        expect(res.status).toBe(200);
        expect(res.body.cleared).toBe(true);

        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
        
        const sessionCookie = Array.isArray(cookies) 
            ? cookies.find((c: string) => c.startsWith('session='))
            : cookies;
        
        expect(sessionCookie).toContain('Expires=Thu, 01 Jan 1970');
    });

    test('Cookie avec caractères spéciaux devrait être encodé/décodé', async () => {
        const res = await request(server)
            .get('/cookies/read')
            .set('Cookie', 'session=hello%20world%21');

        expect(res.status).toBe(200);
        expect(res.body.session).toBe('hello world!');
    });
});
