import "reflect-metadata";
import { ParamType } from "../common/types";

/**
 * Internal helper to register parameter injection metadata.
 * Stores parameter type, index, and optional property key in reflect-metadata.
 *
 * @param type - Parameter type (BODY, QUERY, PARAM, REQ, RES, COOKIE)
 * @param key - Optional property name to extract from object
 * @returns Parameter decorator
 */
function registerParam(type: ParamType, key?: string) {
  return (target: any, propertyKey: string, parameterIndex: number) => {
    const params =
      Reflect.getMetadata("route_params", target, propertyKey) || [];
    params.push({ index: parameterIndex, type, key });
    Reflect.defineMetadata("route_params", params, target, propertyKey);
  };
}

/**
 * Inject request body (or specific property) into parameter.
 * @param key - Optional property name to extract
 */
export function Body(key?: string) {
  return registerParam(ParamType.BODY, key);
}

/**
 * Inject query parameter(s) into parameter.
 * @param key - Optional query param name to extract
 */
export function Query(key?: string) {
  return registerParam(ParamType.QUERY, key);
}

/**
 * Inject route parameter(s) into parameter.
 * @param key - Optional route param name to extract
 */
export function Param(key?: string) {
  return registerParam(ParamType.PARAM, key);
}

/**
 * Inject raw HTTP request object.
 */
export function Req() {
  return registerParam(ParamType.REQ);
}

/**
 * Inject enhanced HTTP response object (with .json(), .cookie(), etc.).
 */
export function Res() {
  return registerParam(ParamType.RES);
}

/**
 * Inject cookie value(s) into parameter.
 * @param key - Optional cookie name to extract
 */
export function Cookie(key?: string) {
  return registerParam(ParamType.COOKIE, key);
}
