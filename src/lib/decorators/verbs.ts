import "reflect-metadata";

/**
 * Internal helper to register route metadata on controller methods.
 * Stores HTTP method, path, order, and handler name in reflect-metadata.
 *
 * @param method - HTTP method (GET, POST, etc.)
 * @param path - Route path
 * @param order - Route priority (higher = higher priority)
 * @param target - Decorator target (controller instance)
 * @param propertyKey - Method name
 */
function registerRoute(
  method: string,
  path: string,
  order: number,
  target: any,
  propertyKey: string,
) {
  const routes = Reflect.getMetadata("routes", target.constructor) || [];
  routes.push({ method, path, order, handlerName: propertyKey });
  Reflect.defineMetadata("routes", routes, target.constructor);
}

/**
 * Define a GET route handler.
 * @param path - Route path (default: '/')
 * @param order - Priority for overlapping routes (default: 0, higher = higher priority)
 */
export function Get(path: string = "/", order: number = 0) {
  return (t: any, k: string) => registerRoute("GET", path, order, t, k);
}

/**
 * Define a POST route handler.
 * @param path - Route path (default: '/')
 * @param order - Priority for overlapping routes (default: 0)
 */
export function Post(path: string = "/", order: number = 0) {
  return (t: any, k: string) => registerRoute("POST", path, order, t, k);
}

/**
 * Define a PUT route handler.
 * @param path - Route path (default: '/')
 * @param order - Priority for overlapping routes (default: 0)
 */
export function Put(path: string = "/", order: number = 0) {
  return (t: any, k: string) => registerRoute("PUT", path, order, t, k);
}

/**
 * Define a DELETE route handler.
 * @param path - Route path (default: '/')
 * @param order - Priority for overlapping routes (default: 0)
 */
export function Delete(path: string = "/", order: number = 0) {
  return (t: any, k: string) => registerRoute("DELETE", path, order, t, k);
}

/**
 * Define a PATCH route handler.
 * @param path - Route path (default: '/')
 * @param order - Priority for overlapping routes (default: 0)
 */
export function Patch(path: string = "/", order: number = 0) {
  return (t: any, k: string) => registerRoute("PATCH", path, order, t, k);
}
