import * as http from 'http';

/**
 * Graceful shutdown handler for clean application termination.
 * Manages SIGTERM/SIGINT signals and cleanup tasks.
 */
export class ShutdownHandler {
    /** Registered cleanup handlers */
    private static cleanupHandlers: (() => void)[] = [];

    /** Shutdown timeout in milliseconds (default: 10 seconds) */
    private static readonly SHUTDOWN_TIMEOUT = 10000;

    /**
     * Setup graceful shutdown handlers for HTTP server.
     * Listens for SIGTERM and SIGINT signals.
     * 
     * Process:
     * 1. Execute all registered cleanup handlers
     * 2. Close HTTP server gracefully
     * 3. Exit process with code 0
     * 4. Force exit after timeout if graceful shutdown fails
     * 
     * @param server - HTTP server instance to shutdown
     */
    static setup(server: http.Server): void {
        const shutdown = async (signal: string) => {
            console.log(`\n⚠️  ${signal} received. Graceful shutdown...`);

            // Execute all cleanup handlers
            ShutdownHandler.cleanupHandlers.forEach(handler => handler());
            ShutdownHandler.cleanupHandlers = [];

            // Close HTTP server gracefully
            server.close(() => {
                console.log("✅ HTTP server closed");
                process.exit(0);
            });

            // Force shutdown after timeout
            setTimeout(() => {
                console.error("❌ Timeout: Force shutdown");
                process.exit(1);
            }, ShutdownHandler.SHUTDOWN_TIMEOUT);
        };

        const sigtermHandler = () => shutdown('SIGTERM');
        const sigintHandler = () => shutdown('SIGINT');

        process.on('SIGTERM', sigtermHandler);
        process.on('SIGINT', sigintHandler);

        // Register cleanup to remove listeners
        ShutdownHandler.registerCleanup(() => {
            process.removeListener('SIGTERM', sigtermHandler);
            process.removeListener('SIGINT', sigintHandler);
        });
    }

    /**
     * Register a cleanup handler to be executed during shutdown.
     * 
     * @param handler - Cleanup function to execute
     */
    static registerCleanup(handler: () => void): void {
        ShutdownHandler.cleanupHandlers.push(handler);
    }
}
