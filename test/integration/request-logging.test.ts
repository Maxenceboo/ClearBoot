import request from 'supertest';
import * as http from 'http';
import { ClearBoot, Controller, Get, Post } from '../../src/lib';
import { logger } from '../../src/lib/common/logger';

@Controller('/log-test')
class LogTestController {
    @Get('/success')
    success() {
        return { ok: true };
    }

    @Get('/not-found')
    notFound() {
        return { found: false };
    }

    @Post('/created')
    created() {
        return { created: true };
    }
}

describe('HTTP Request Logging', () => {
    let app: http.Server;
    let logMessages: string[] = [];

    beforeAll(async () => {
        app = await ClearBoot.create({ port: 0 });
    });

    afterAll((done) => {
        app.close(done);
    });

    beforeEach(() => {
        logMessages = [];
        // Reconfigure for each test (auto-resets to silent in test env)
        logger.configure({
            level: 'info',
            transport: (msg) => logMessages.push(msg)
        });
    });

    test('logs GET request with 200 status', async () => {
        await request(app).get('/log-test/success');

        const requestLog = logMessages.find(msg => msg.includes('GET /log-test/success'));
        expect(requestLog).toBeDefined();
        expect(requestLog).toMatch(/GET \/log-test\/success - .*200.* \(\d+ms\)/);
    });

    test('logs POST request with 200 status', async () => {
        await request(app).post('/log-test/created').send({ data: 'test' });

        const requestLog = logMessages.find(msg => msg.includes('POST /log-test/created'));
        expect(requestLog).toBeDefined();
        expect(requestLog).toMatch(/POST \/log-test\/created - .*200.* \(\d+ms\)/);
    });

    test('logs 404 not found', async () => {
        await request(app).get('/does-not-exist');

        const requestLog = logMessages.find(msg => msg.includes('GET /does-not-exist'));
        expect(requestLog).toBeDefined();
        expect(requestLog).toMatch(/GET \/does-not-exist - .*404.* \(\d+ms\)/);
    });

    test('includes request duration', async () => {
        await request(app).get('/log-test/success');

        const requestLog = logMessages.find(msg => msg.includes('GET /log-test/success'));
        expect(requestLog).toMatch(/\(\d+ms\)/);
    });

    test('respects silent log level', async () => {
        logger.configure({ level: 'silent' });
        logMessages = [];

        await request(app).get('/log-test/success');

        const requestLog = logMessages.find(msg => msg.includes('GET /log-test/success'));
        expect(requestLog).toBeUndefined();
    });
});
