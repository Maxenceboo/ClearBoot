import { globalContainer, inject } from "../../di/container";
import { PROVIDERS_REGISTRY } from "../../common/types";
import { ModuleInitClass } from "../../common/interfaces";
import { logger } from "../../common/logger";

/**
 * Module loader responsible for initializing dependency injection
 * and executing lifecycle hooks.
 */
export class ModuleLoader {
  /**
   * Register all injectable services in the DI container.
   * Scans PROVIDERS_REGISTRY and instantiates each service.
   */
  static registerServices(): void {
    PROVIDERS_REGISTRY.forEach((P) => globalContainer.register(P, new P()));
  }

  /**
   * Execute onModuleInit lifecycle hooks.
   * Supports:
   * - Plain async functions: () => Promise<void>
   * - Injectable classes implementing IModuleInit
   * - Arrays mixing both types
   *
   * @param hooks - Single hook or array of hooks to execute
   */
  static async executeLifecycleHooks(
    hooks:
      | (() => Promise<void> | void)
      | ModuleInitClass
      | Array<(() => Promise<void> | void) | ModuleInitClass>,
  ): Promise<void> {
    logger.info("⏳ Running onModuleInit()...");

    // Normalize to array
    const items = Array.isArray(hooks) ? hooks : [hooks];

    for (const item of items) {
      if (typeof item === "function") {
        // Check if it's a class constructor (not a plain function)
        const isClass = /^class\s/.test(item.toString());

        if (isClass) {
          // Inject class and call init() method (IModuleInit interface)
          const instance: any = inject(item as any);
          if (typeof instance?.init !== "function") {
            throw new Error(
              "onModuleInit class must implement init() (IModuleInit)",
            );
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

    logger.info("✅ onModuleInit() completed\n");
  }
}
