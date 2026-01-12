import * as http from 'http';
import { globalContainer } from '../di/container';
import { PROVIDERS_REGISTRY } from '../common/types';
import { MetadataScanner } from './metadata-scanner';
import { RequestHandler } from './request-handler';

export interface ModuleConfig { port?: number; }

export class ClearBoot {
    static create(config: ModuleConfig) {
        const port = config.port || 3000;
        console.log("\n🚀 Démarrage de ClearBoot (Atomic Architecture)...\n");

        // 1. Init Services
        PROVIDERS_REGISTRY.forEach(P => globalContainer.register(P, new P()));

        // 2. Scan Controllers
        const controllers = MetadataScanner.scan();

        // 3. Create Server
        const server = http.createServer((req, res) => {
            RequestHandler.handle(req, res, controllers);
        });

        if (config.port) {
            server.listen(port, () => {
                console.log(`🔥 Prêt sur port ${port}`);
            });
        }
        return server;
    }
}