/**
 * Lifecycle management - centralized exports.
 *
 * Provides application lifecycle utilities:
 * - Module loading and DI initialization
 * - Lifecycle hooks execution
 * - Graceful shutdown handling
 */

export { ModuleLoader } from "./module-loader";
export { ShutdownHandler } from "./shutdown-handler";
