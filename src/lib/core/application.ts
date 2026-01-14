import * as http from 'http';
import * as dotenv from 'dotenv';
import { globalContainer, inject } from '../di/container';
import { PROVIDERS_REGISTRY } from '../common/types';
import { MetadataScanner } from './metadata-scanner';
import { RequestHandler } from './request-handler';
import { MiddlewareClass, ModuleInitClass } from '../common/interfaces';
import { CorsOptions } from '../http/cors';

/**
 * Module configuration for ClearBoot application.
 * Defines server settings, middlewares, CORS, and lifecycle hooks.
 */
export interface ModuleConfig {
    /** HTTP server port (default: 3000 or process.env.PORT) */
    port?: number;
    /** Global middlewares applied to all routes */
    globalMiddlewares?: MiddlewareClass[];
    /** CORS configuration */
    cors?: CorsOptions;
    /** Lifecycle hook: executed before server starts.\n     * Can be: function, injectable class with init(), or array of both */
    onModuleInit?:
        | (() => Promise<void> | void)
        | ModuleInitClass
        | Array<(() => Promise<void> | void) | ModuleInitClass>;
}

/**
 * Main ClearBoot application class.
 * Handles server creation, DI container setup, lifecycle hooks, and graceful shutdown.
 */
export class ClearBoot {
    /** Cleanup handlers for graceful shutdown */
    private static shutdownHandlers: (() => void)[] = [];

    /**
     * Create and start ClearBoot HTTP server.
     * 
     * Process:
     * 1. Load environment variables from .env
     * 2. Calculate port (config > env > default 3000)
     * 3. Register all services (@Injectable) in DI container
     * 4. Execute onModuleInit lifecycle hooks
     * 5. Scan and register all controllers (@Controller)
     * 6. Create HTTP server with request handler
     * 7. Setup graceful shutdown handlers (SIGTERM, SIGINT)
     * 8. Start listening on port
     * 
     * @param config - Module configuration
     * @returns HTTP server instance
     * 
     * @example
     * const server = await ClearBoot.create({
     *   port: 3000,
     *   globalMiddlewares: [LoggerMiddleware],
     *   cors: { origin: '*' },
     *   onModuleInit: async () => {
     *     await database.connect();
     *   }
     * });\n     */
    static async create(config: ModuleConfig = {}) {
        // 1. Load environment variables from .env file
        dotenv.config();

        // 2. Smart port calculation: config > env > default 3000
        const port = config.port ?? (process.env.PORT ? parseInt(process.env.PORT) : 3000);

        console.log("\n🚀 Starting ClearBoot...\n");

        // 3. Register all services (@Injectable) in DI container
        PROVIDERS_REGISTRY.forEach(P => globalContainer.register(P, new P()));

        // 4. Lifecycle Hook - Execute before starting server
        if (config.onModuleInit) {
            console.log("⏳ Running onModuleInit()...");

            // Support single item or array of items
            const items = Array.isArray(config.onModuleInit)
                ? config.onModuleInit
                : [config.onModuleInit];

            for (const item of items) {
                if (typeof item === 'function') {
                    // Check if it's a class (not a plain function)
                    const isClass = /^class\s/.test(item.toString());

                    if (isClass) {
                        // Inject and call init() method (IModuleInit interface)
                        const instance: any = inject(item as any);
                        if (typeof instance?.init !== 'function') {
                            throw new Error('onModuleInit class must implement init() (IModuleInit)');
                        }
                        await instance.init();
                        continue;
                    }

                    // Plain function
                    await (item as any)();
                    continue;
                }

                // Fallback: assume callable
                await (item as any)();
            }

            console.log("✅ onModuleInit() completed\n");
        }

        // 5. Scan all controllers (@Controller) and build routing table
        const controllers = MetadataScanner.scan();
        const globalMiddlewares = config.globalMiddlewares || [];

        // 6. Create HTTP server with request handler
        const server = http.createServer((req, res) => {
            RequestHandler.handle(req, res, controllers, globalMiddlewares, config.cors);
        });

        // 7. Graceful Shutdown Handler (SIGTERM, SIGINT)
        const shutdown = async (signal: string) => {
            console.log(`\n⚠️  ${signal} received. Graceful shutdown...`);

            // Execute cleanup handlers
            ClearBoot.shutdownHandlers.forEach(handler => handler());
            ClearBoot.shutdownHandlers = [];

            // Close HTTP server gracefully
            server.close(() => {
                console.log("✅ HTTP server closed");
                process.exit(0);
            });

            // Force shutdown after 10 seconds timeout
            setTimeout(() => {
                console.error("❌ Timeout: Force shutdown");
                process.exit(1);
            }, 10000);
        };

        const sigtermHandler = () => shutdown('SIGTERM');
        const sigintHandler = () => shutdown('SIGINT');

        process.on('SIGTERM', sigtermHandler);
        process.on('SIGINT', sigintHandler);

        // Store cleanup function to remove listeners
        ClearBoot.shutdownHandlers.push(() => {
            process.removeListener('SIGTERM', sigtermHandler);
            process.removeListener('SIGINT', sigintHandler);
        });

        // 8. Start HTTP server
        server.listen(port, () => {
            if (port > 0) console.log(`🔥 Ready on port ${port}`);
        });

        return server;
    }
}