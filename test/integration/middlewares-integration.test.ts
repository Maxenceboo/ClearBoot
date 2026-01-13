import request from 'supertest';
import * as http from 'http';
import { ClearBoot, Controller, Get, Post, Body, Injectable } from '../../src/lib/index';
import { HelmetMiddleware, LoggerMiddleware, RateLimitMiddleware } from '../../src/lib';
import { IMiddleware } from '../../src/lib/common/interfaces';
import { ClearResponse } from '../../src/lib/http/response';

@Controller('/test-all-mw')
class TestController {
    @Get('/hello')
    hello() {
        return { msg: 'hello' };
    }

    @Post('/echo')
    echo(@Body() body: any) {
        return body;
    }
}

describe('INTEGRATION - All Built-in Middlewares', () => {
    let server: http.Server;

    beforeAll(() => {
        server = ClearBoot.create({
            port: 0,
            globalMiddlewares: [
                HelmetMiddleware,
                LoggerMiddleware,
                RateLimitMiddleware
            ]
        });
    });

    afterAll((done) => {
        server.close(done);
    });

    // --- HELMET TESTS ---
    test('HelmetMiddleware should set X-Content-Type-Options header', async () => {
        const res = await request(server).get('/test-all-mw/hello');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    test('HelmetMiddleware should set X-Frame-Options header', async () => {
        const res = await request(server).get('/test-all-mw/hello');
        expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    test('HelmetMiddleware should set X-XSS-Protection header', async () => {
        const res = await request(server).get('/test-all-mw/hello');
        expect(res.headers['x-xss-protection']).toBe('1; mode=block');
    });

    test('HelmetMiddleware should set X-DNS-Prefetch-Control header', async () => {
        const res = await request(server).get('/test-all-mw/hello');
        expect(res.headers['x-dns-prefetch-control']).toBe('off');
    });

    test('HelmetMiddleware should set X-Download-Options header', async () => {
        const res = await request(server).get('/test-all-mw/hello');
        expect(res.headers['x-download-options']).toBe('noopen');
    });

    // --- LOGGER TESTS ---
    test('LoggerMiddleware should process request without error', async () => {
        const res = await request(server).get('/test-all-mw/hello');
        expect(res.status).toBe(200);
        expect(res.body.msg).toBe('hello');
    });

    // --- RATE LIMIT TESTS ---
    test('RateLimitMiddleware should add X-RateLimit headers', async () => {
        const res = await request(server).get('/test-all-mw/hello');
        expect(res.headers['x-ratelimit-limit']).toBe('100');
        expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    });

    test('RateLimitMiddleware should allow normal requests', async () => {
        for (let i = 0; i < 5; i++) {
            const res = await request(server).get('/test-all-mw/hello');
            expect(res.status).toBe(200);
        }
    });

    test('All middlewares should work together', async () => {
        const res = await request(server).post('/test-all-mw/echo').send({ test: 'data' });
        expect(res.status).toBe(200);
        expect(res.body.test).toBe('data');
        // Check all headers are present
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers['x-ratelimit-limit']).toBe('100');
    });
});
