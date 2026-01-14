import * as http from 'http';
import { ParamType } from '../../common/types';
import { ClearResponse } from '../../http/response';

/**
 * Handles parameter injection for route handlers.
 * Extracts values from various sources and injects them based on decorators.
 */
export class ParameterInjector {
    /**
     * Build arguments array for controller method from decorator metadata.
     * 
     * @param paramsMeta - Parameter metadata from decorators
     * @param req - HTTP request
     * @param res - Extended HTTP response
     * @param bodyParams - Parsed request body
     * @param queryParams - Parsed query parameters
     * @param routeParams - Extracted route parameters
     * @param cookies - Parsed cookies
     * @returns Arguments array ready for controller method call
     */
    static buildArguments(
        paramsMeta: any[],
        req: http.IncomingMessage,
        res: ClearResponse,
        bodyParams: any,
        queryParams: any,
        routeParams: any,
        cookies: any
    ): any[] {
        // Parameter injection based on decorators (@Body, @Param, @Query, etc.)
        let args: any[] = [];
        
        if (paramsMeta.length > 0) {
            // Build arguments array from decorator metadata
            args = new Array(paramsMeta.length);
            paramsMeta.forEach((p: any) => {
                let val: any = null;
                
                // Resolve value based on parameter type
                if (p.type === ParamType.REQ) val = req;
                else if (p.type === ParamType.RES) val = res;
                else if (p.type === ParamType.BODY) val = bodyParams;
                else if (p.type === ParamType.QUERY) val = queryParams;
                else if (p.type === ParamType.PARAM) val = routeParams;
                else if (p.type === ParamType.COOKIE) val = cookies;

                // Extract specific property if key provided (e.g., @Param('id'))
                if (p.key && val && typeof val === 'object') {
                    args[p.index] = val[p.key];
                } else {
                    args[p.index] = val;
                }
            });
        } else {
            // Auto-merge: if no decorators, merge all params into single object
            args = [{ ...queryParams, ...bodyParams, ...routeParams }];
        }

        return args;
    }
}
