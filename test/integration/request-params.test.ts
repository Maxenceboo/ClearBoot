import request from 'supertest';
import * as http from 'http';
import { ClearBoot, Controller, Get, Post, Body, Query, Param, Req, Res } from '../../src/lib/index';
import { ClearResponse } from '../../src/lib/http/response';

@Controller('/params')
class ParamsController {
    // Test @Req decorator
    @Get('/req-test')
    testReq(@Req() req: http.IncomingMessage) {
        return {
            method: req.method,
            hasUrl: !!req.url
        };
    }

    // Test @Res decorator
    @Post('/res-test')
    testRes(@Res() res: ClearResponse, @Body() body: any) {
        res.status(201).json({ created: true, data: body });
    }

    // Test @Body with key
    @Post('/body-key')
    bodyKey(@Body('name') name: string, @Body('age') age: number) {
        return { name, age };
    }

    // Test @Query with key
    @Get('/query-key')
    queryKey(@Query('filter') filter: string) {
        return { filter };
    }

    // Test @Param with key
    @Get('/users/:id')
    paramKey(@Param('id') id: string) {
        return { id };
    }

    // Test all together
    @Post('/complex/:id')
    complex(
        @Param('id') id: string,
        @Query('type') type: string,
        @Body() body: any,
        @Req() req: http.IncomingMessage
    ) {
        return {
            id,
            type,
            body,
            method: req.method
        };
    }
}

describe('INTEGRATION - Request Parameters (@Req, @Res, keys)', () => {
    let server: http.Server;

    beforeAll(() => {
        server = ClearBoot.create({ port: 0 });
    });

    afterAll((done) => {
        server.close(done);
    });

    // --- @Req TESTS ---
    test('@Req should inject the IncomingMessage', async () => {
        const res = await request(server).get('/params/req-test');
        expect(res.status).toBe(200);
        expect(res.body.method).toBe('GET');
        expect(res.body.hasUrl).toBe(true);
    });

    // --- @Res TESTS ---
    test('@Res should allow custom response handling', async () => {
        const res = await request(server)
            .post('/params/res-test')
            .send({ name: 'Max' });
        expect(res.status).toBe(201);
        expect(res.body.created).toBe(true);
        expect(res.body.data.name).toBe('Max');
    });

    // --- @Body with key ---
    test('@Body(key) should extract specific property', async () => {
        const res = await request(server)
            .post('/params/body-key')
            .send({ name: 'Alice', age: 25, extra: 'ignored' });
        expect(res.body.name).toBe('Alice');
        expect(res.body.age).toBe(25);
    });

    // --- @Query with key ---
    test('@Query(key) should extract specific param', async () => {
        const res = await request(server).get('/params/query-key?filter=active');
        expect(res.body.filter).toBe('active');
    });

    // --- @Param with key ---
    test('@Param(key) should extract route param', async () => {
        const res = await request(server).get('/params/users/123');
        expect(res.body.id).toBe('123');
    });

    // --- Complex test ---
    test('Multiple decorators should work together', async () => {
        const res = await request(server)
            .post('/params/complex/abc?type=premium')
            .send({ action: 'create' });

        expect(res.status).toBe(200);
        expect(res.body.id).toBe('abc');
        expect(res.body.type).toBe('premium');
        expect(res.body.body.action).toBe('create');
        expect(res.body.method).toBe('POST');
    });
});
