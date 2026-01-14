import * as http from "http";
import { ClearResponse } from "../../http/response";
import { globalContainer } from "../../di/container";
import { MiddlewareClass, IMiddleware } from "../../common/interfaces";

/**
 * Middleware dispatch and composition.
 * Handles execution of middleware chains in Koa-style composition.
 */
export class MiddlewareDispatcher {
  /**
   * Execute middleware chain.
   * Processes global, controller, and route middlewares in sequence,
   * then calls the final handler.
   *
   * @param middlewares - Array of middleware classes to execute
   * @param req - HTTP request
   * @param res - HTTP response
   * @param handler - Final handler to call after all middlewares
   */
  static async dispatch(
    middlewares: MiddlewareClass[],
    req: http.IncomingMessage,
    res: ClearResponse,
    handler: () => Promise<void>,
  ): Promise<void> {
    let index = -1;

    const execute = async (i: number) => {
      // Prevent calling same middleware twice
      if (i <= index) return;
      index = i;

      // All middlewares executed, call final handler
      if (i === middlewares.length) {
        await handler();
        return;
      }

      // Resolve and execute current middleware
      const MiddlewareClass = middlewares[i];
      const instance = globalContainer.resolve(MiddlewareClass) as IMiddleware;

      try {
        // Call middleware with next() function to continue chain
        await instance.use(req, res, () => execute(i + 1));
      } catch (err) {
        throw err;
      }
    };

    await execute(0);
  }
}
