import * as http from "http";
import { ClearResponse } from "../http/response";

/**
 * HTTP middleware interface.
 * Middlewares process requests in a chain before reaching the route handler.
 */
export interface IMiddleware {
  /**
   * Middleware execution function.
   *
   * @param req - Incoming HTTP request
   * @param res - Enhanced response object with .json(), .cookie(), etc.
   * @param next - Call to continue to next middleware or handler
   */
  use(req: http.IncomingMessage, res: ClearResponse, next: () => void): void;
}

/**
 * HTTP header provider interface.
 * Used with @Header() decorator to dynamically set response headers.
 */
export interface IHeaderProvider {
  /**
   * Get custom headers to apply to response.
   * @returns Map of header name -> value
   */
  getHeaders(): Record<string, string>;
}

/** Middleware class constructor type */
export type MiddlewareClass = new (...args: any[]) => IMiddleware;

/** Header provider class constructor type */
export type HeaderProviderClass = new (...args: any[]) => IHeaderProvider;

/**
 * Module initialization lifecycle hook interface.
 * Implement this to run initialization code when module starts.
 */
export interface IModuleInit {
  /**
   * Initialize module resources (database, cache, etc.).
   * Called before HTTP server starts listening.
   */
  init(): Promise<void> | void;
}

/** Module init class constructor type */
export type ModuleInitClass = new (...args: any[]) => IModuleInit;
