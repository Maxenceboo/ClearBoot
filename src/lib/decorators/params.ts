import 'reflect-metadata';
import { ParamType } from '../common/types';

function registerParam(type: ParamType, key?: string) {
    return (target: any, propertyKey: string, parameterIndex: number) => {
        const params = Reflect.getMetadata('route_params', target, propertyKey) || [];
        params.push({ index: parameterIndex, type, key });
        Reflect.defineMetadata('route_params', params, target, propertyKey);
    };
}

export function Body(key?: string) { return registerParam(ParamType.BODY, key); }
export function Query(key?: string) { return registerParam(ParamType.QUERY, key); }
export function Param(key?: string) { return registerParam(ParamType.PARAM, key); }
export function Req() { return registerParam(ParamType.REQ); }
export function Res() { return registerParam(ParamType.RES); }