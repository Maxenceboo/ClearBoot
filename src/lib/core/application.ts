import * as http from 'http';
import { globalContainer } from '../di/container';
import { PROVIDERS_REGISTRY } from '../common/types';
import { MetadataScanner } from './metadata-scanner';
import { RequestHandler } from './request-handler';
import { MiddlewareClass } from '../common/interfaces';

export interface ModuleConfig {
    port?: number;
    globalMiddlewares?: MiddlewareClass[];
}

export class ClearBoot {
    static create(config: ModuleConfig) {
        // CORRECTION ICI : On accepte 0 comme port valide
        const port = config.port !== undefined ? config.port : 3000;

        console.log("\n🚀 Démarrage de ClearBoot (Strict Mode)...\n");

        PROVIDERS_REGISTRY.forEach(P => globalContainer.register(P, new P()));
        const controllers = MetadataScanner.scan();
        const globalMiddlewares = config.globalMiddlewares || [];

        const server = http.createServer((req, res) => {
            RequestHandler.handle(req, res, controllers, globalMiddlewares);
        });

        // CORRECTION ICI : On vérifie si ce n'est pas undefined
        if (config.port !== undefined) {
            server.listen(port, () => {
                // On n'affiche le log que si le port > 0 (pour ne pas polluer les tests)
                if (port > 0) console.log(`🔥 Prêt sur port ${port}`);
            });
        }

        return server;
    }
}