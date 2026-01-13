import request from 'supertest';
import * as http from 'http';
import { ClearBoot, Controller, Post, Body } from '../../src/lib/index';

@Controller('/form')
class FormController {
    @Post('/submit')
    submitForm(@Body() body: any) {
        return { received: body };
    }
}

describe('INTEGRATION - Form Data', () => {
    let server: http.Server;

    beforeAll(async () => {
        server = await ClearBoot.create({ port: 0 });
    });

    afterAll((done) => {
        server.close(done);
    });

    test('POST /form/submit - devrait parser application/x-www-form-urlencoded', async () => {
        const res = await request(server)
            .post('/form/submit')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send('name=Max&email=max@test.com&age=25');

        expect(res.status).toBe(200);
        expect(res.body.received).toEqual({
            name: 'Max',
            email: 'max@test.com',
            age: '25'
        });
    });

    test('POST /form/submit - devrait gérer les espaces dans les valeurs', async () => {
        const res = await request(server)
            .post('/form/submit')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send('message=Hello+World&title=My+Title');

        expect(res.status).toBe(200);
        expect(res.body.received.message).toBe('Hello World');
        expect(res.body.received.title).toBe('My Title');
    });

    test('POST /form/submit - devrait gérer les champs multiples', async () => {
        const res = await request(server)
            .post('/form/submit')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send('tags=javascript&tags=typescript&tags=node');

        expect(res.status).toBe(200);
        expect(res.body.received.tags).toEqual(['javascript', 'typescript', 'node']);
    });

    test('POST /form/submit - devrait gérer les caractères spéciaux encodés', async () => {
        const res = await request(server)
            .post('/form/submit')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send('name=%C3%A9cole&symbol=%26%3D%3F');

        expect(res.status).toBe(200);
        expect(res.body.received.name).toBe('école');
        expect(res.body.received.symbol).toBe('&=?');
    });

    test('POST /form/submit - devrait accepter un body vide', async () => {
        const res = await request(server)
            .post('/form/submit')
            .set('Content-Type', 'application/x-www-form-urlencoded')
            .send('');

        expect(res.status).toBe(200);
        expect(res.body.received).toEqual({});
    });
});
