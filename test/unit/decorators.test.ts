import 'reflect-metadata';
import { Get, Post, Put, Delete, Patch } from '../../src/lib/decorators/verbs';
import { Body, Query, Param, Req, Res } from '../../src/lib/decorators/params';
import { HttpCode, Header } from '../../src/lib/decorators/features';

describe('UNIT - HTTP Verb Decorators', () => {
    test('@Get should register GET route', () => {
        class TestController {
            @Get('/test')
            test() {}
        }

        const routes = Reflect.getMetadata('routes', TestController);
        expect(routes).toBeDefined();
        expect(routes[0].method).toBe('GET');
        expect(routes[0].path).toBe('/test');
    });

    test('@Post should register POST route', () => {
        class TestController {
            @Post('/create')
            create() {}
        }

        const routes = Reflect.getMetadata('routes', TestController);
        expect(routes[0].method).toBe('POST');
    });

    test('@Put should register PUT route', () => {
        class TestController {
            @Put('/update')
            update() {}
        }

        const routes = Reflect.getMetadata('routes', TestController);
        expect(routes[0].method).toBe('PUT');
    });

    test('@Delete should register DELETE route', () => {
        class TestController {
            @Delete('/remove')
            remove() {}
        }

        const routes = Reflect.getMetadata('routes', TestController);
        expect(routes[0].method).toBe('DELETE');
    });

    test('@Patch should register PATCH route', () => {
        class TestController {
            @Patch('/partial')
            partial() {}
        }

        const routes = Reflect.getMetadata('routes', TestController);
        expect(routes[0].method).toBe('PATCH');
    });

    test('Routes with default path should use "/"', () => {
        class TestController {
            @Get()
            list() {}
        }

        const routes = Reflect.getMetadata('routes', TestController);
        expect(routes[0].path).toBe('/');
    });

    test('Routes with order should be registered', () => {
        class TestController {
            @Get('/a', 2)
            a() {}

            @Get('/b', 1)
            b() {}
        }

        const routes = Reflect.getMetadata('routes', TestController);
        expect(routes.length).toBe(2);
    });
});

describe('UNIT - Parameter Decorators', () => {
    test('@Body should register BODY param', () => {
        class TestController {
            method(@Body() body: any) {}
        }

        const instance = new TestController();
        const params = Reflect.getMetadata('route_params', instance, 'method');
        expect(params).toBeDefined();
        expect(params[0].type).toBe('BODY');
    });

    test('@Body(key) should register specific key extraction', () => {
        class TestController {
            method(@Body('name') name: string) {}
        }

        const instance = new TestController();
        const params = Reflect.getMetadata('route_params', instance, 'method');
        expect(params[0].key).toBe('name');
    });

    test('@Query should register QUERY param', () => {
        class TestController {
            method(@Query() query: any) {}
        }

        const instance = new TestController();
        const params = Reflect.getMetadata('route_params', instance, 'method');
        expect(params[0].type).toBe('QUERY');
    });

    test('@Param should register PARAM', () => {
        class TestController {
            method(@Param('id') id: string) {}
        }

        const instance = new TestController();
        const params = Reflect.getMetadata('route_params', instance, 'method');
        expect(params[0].type).toBe('PARAM');
        expect(params[0].key).toBe('id');
    });

    test('@Req should register REQ type', () => {
        class TestController {
            method(@Req() req: any) {}
        }

        const instance = new TestController();
        const params = Reflect.getMetadata('route_params', instance, 'method');
        expect(params[0].type).toBe('REQ');
    });

    test('@Res should register RES type', () => {
        class TestController {
            method(@Res() res: any) {}
        }

        const instance = new TestController();
        const params = Reflect.getMetadata('route_params', instance, 'method');
        expect(params[0].type).toBe('RES');
    });
});

describe('UNIT - Feature Decorators', () => {
    test('@HttpCode should set custom status code', () => {
        class TestController {
            @HttpCode(201)
            create() {}
        }

        const instance = new TestController();
        const code = Reflect.getMetadata('http_code', instance, 'create');
        expect(code).toBe(201);
    });

    test('@Header should set custom response header', () => {
        class TestController {
            @Header('X-Custom', 'value')
            test() {}
        }

        const instance = new TestController();
        const headers = Reflect.getMetadata('response_headers', instance, 'test');
        expect(headers['X-Custom']).toBe('value');
    });

    test('@Header with multiple calls should accumulate', () => {
        class TestController {
            @Header('X-First', 'val1')
            @Header('X-Second', 'val2')
            test() {}
        }

        const instance = new TestController();
        const headers = Reflect.getMetadata('response_headers', instance, 'test');
        expect(headers['X-First']).toBe('val1');
        expect(headers['X-Second']).toBe('val2');
    });
});
