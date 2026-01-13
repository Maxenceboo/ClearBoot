import * as http from 'http';
import * as dotenv from 'dotenv';
import { globalContainer, inject } from '../di/container';
import { PROVIDERS_REGISTRY } from '../common/types';
import { MetadataScanner } from './metadata-scanner';
import { RequestHandler } from './request-handler';
import { MiddlewareClass, ModuleInitClass } from '../common/interfaces';
import { CorsOptions } from '../http/cors';

export interface ModuleConfig {
    port?: number;
    globalMiddlewares?: MiddlewareClass[];
    cors?: CorsOptions;
    // 👇 Lifecycle hook: function, injectable class with init(), or array of both
    onModuleInit?:
        | (() => Promise<void> | void)
        | ModuleInitClass
        | Array<(() => Promise<void> | void) | ModuleInitClass>;
}

export class ClearBoot {
    private static shutdownHandlers: (() => void)[] = [];

    static async create(config: ModuleConfig = {}) {
        // 1. Charger les variables d'environnement (.env)
        dotenv.config();

        // 2. Calcul intelligent du port
        const port = config.port ?? (process.env.PORT ? parseInt(process.env.PORT) : 3000);

        console.log("\n🚀 Démarrage de ClearBoot...\n");

        // 3. Enregistrement des Services (Providers)
        PROVIDERS_REGISTRY.forEach(P => globalContainer.register(P, new P()));

        // 4. Lifecycle Hook - Exécuter avant de démarrer le serveur
        if (config.onModuleInit) {
            console.log("⏳ Exécution de onModuleInit()...");

            const items = Array.isArray(config.onModuleInit)
                ? config.onModuleInit
                : [config.onModuleInit];

            for (const item of items) {
                if (typeof item === 'function') {
                    const isClass = /^class\s/.test(item.toString());

                    if (isClass) {
                        const instance: any = inject(item as any);
                        if (typeof instance?.init !== 'function') {
                            throw new Error('onModuleInit class must implement init() (IModuleInit)');
                        }
                        await instance.init();
                        continue;
                    }

                    await (item as any)();
                    continue;
                }

                await (item as any)();
            }

            console.log("✅ onModuleInit() terminé\n");
        }

        // 5. Scan des Contrôleurs
        const controllers = MetadataScanner.scan();
        const globalMiddlewares = config.globalMiddlewares || [];

        // 6. Création du Serveur HTTP
        const server = http.createServer((req, res) => {
            RequestHandler.handle(req, res, controllers, globalMiddlewares, config.cors);
        });

        // 7. Graceful Shutdown Handler
        const shutdown = async (signal: string) => {
            console.log(`\n⚠️  ${signal} reçu. Fermeture gracieuse...`);

            // Cleanup handlers
            ClearBoot.shutdownHandlers.forEach(handler => handler());
            ClearBoot.shutdownHandlers = [];

            server.close(() => {
                console.log("✅ Serveur HTTP fermé");
                process.exit(0);
            });

            // Force shutdown après 10 secondes
            setTimeout(() => {
                console.error("❌ Timeout: Fermeture forcée");
                process.exit(1);
            }, 10000);
        };

        const sigtermHandler = () => shutdown('SIGTERM');
        const sigintHandler = () => shutdown('SIGINT');

        process.on('SIGTERM', sigtermHandler);
        process.on('SIGINT', sigintHandler);

        // Store cleanup function
        ClearBoot.shutdownHandlers.push(() => {
            process.removeListener('SIGTERM', sigtermHandler);
            process.removeListener('SIGINT', sigintHandler);
        });

        // 8. Démarrage
        server.listen(port, () => {
            if (port > 0) console.log(`🔥 Prêt sur port ${port}`);
        });

        return server;
    }
}