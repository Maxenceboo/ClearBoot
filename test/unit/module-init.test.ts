import { ClearBoot, Injectable, IModuleInit, Controller, Get } from '../../src/lib';

@Controller('/dummy')
class DummyController {
    @Get('/')
    index() {
        return { ok: true };
    }
}

describe('onModuleInit contract', () => {
    it('throws if a class without init() is provided', async () => {
        @Injectable()
        class BadInitService { }

        await expect(
            ClearBoot.create({ onModuleInit: BadInitService as any, port: 0 })
        ).rejects.toThrow('IModuleInit');
    });

    it('accepts a proper IModuleInit implementation', async () => {
        @Injectable()
        class GoodInitService implements IModuleInit {
            called = false;
            async init() {
                this.called = true;
            }
        }

        const server = await ClearBoot.create({ onModuleInit: GoodInitService, port: 0 });
        server.close();
    });
});
