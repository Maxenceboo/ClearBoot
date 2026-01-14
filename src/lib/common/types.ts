/**
 * Parameter types for dependency injection.
 * Identifies which source to extract parameter values from in route handlers.
 */
export enum ParamType {
  /** Request body parameter */
  BODY = "BODY",
  /** Query string parameter */
  QUERY = "QUERY",
  /** Route path parameter */
  PARAM = "PARAM",
  /** Raw HTTP request object */
  REQ = "REQ",
  /** Enhanced HTTP response object */
  RES = "RES",
  /** Cookie value */
  COOKIE = "COOKIE",
}

/**
 * Global registry of injectable service classes.
 * Populated by @Injectable() decorator.
 * Used by DI container to instantiate services on module init.
 * @internal
 */
export const PROVIDERS_REGISTRY: any[] = [];

/**
 * Global registry of controller classes.
 * Populated by @Controller() decorator.
 * Used by MetadataScanner to build routing table.
 * @internal
 */
export const CONTROLLERS_REGISTRY: any[] = [];
