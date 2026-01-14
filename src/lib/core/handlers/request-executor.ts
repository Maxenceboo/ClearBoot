import * as http from 'http';
import { ClearResponse } from '../../http/response';
import { isJson } from '../../http/request-utils';
import { logger } from '../../common/logger';

/**
 * Handles request execution and response generation.
 * Calls controller methods and formats responses.
 */
export class RequestExecutor {
    /**
     * Execute controller handler method.
     * 
     * @param instance - Controller instance
     * @param handlerName - Method name to call
     * @param args - Arguments to pass to method
     * @param res - HTTP response
     * @returns Result from handler method
     */
    static async executeHandler(
        instance: any,
        handlerName: string,
        args: any[],
        res: ClearResponse
    ): Promise<void> {
        // Call the controller method
        const result = await instance[handlerName](...args);

        if (res.writableEnded) return;

        // Apply custom response headers
        const customHeaders = Reflect.getMetadata('response_headers', instance, handlerName) || {};
        Object.keys(customHeaders).forEach(key => res.setHeader(key, customHeaders[key]));

        // Get custom HTTP status code or default to 200
        const statusCode = Reflect.getMetadata('http_code', instance, handlerName) || 200;

        // Send response based on result type
        if (typeof result === 'object') {
            res.status(statusCode).json(result);
        } else {
            res.status(statusCode).send(String(result));
        }
    }

    /**
     * Handle request errors and send error response.
     * 
     * @param error - Error object
     * @param res - HTTP response
     * @param status - HTTP status code (default: 500)
     */
    static handleError(error: any, res: ClearResponse, status: number = 500): void {
        if (res.writableEnded) return;

        const errorStatus = error.status || status;
        const message = isJson(error.message) 
            ? JSON.parse(error.message) 
            : { error: error.message };

        // Log internal server errors
        if (errorStatus === 500) {
            logger.minimal(`🔥 INTERNAL ERROR: ${error.message}`);
            if (error.stack) logger.debug(error.stack);
        }

        // Return standardized error response
        res.status(errorStatus).json({
            statusCode: errorStatus,
            ...(typeof message === 'object' ? message : { message }),
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle 404 route not found response.
     * 
     * @param res - HTTP response
     */
    static handle404(res: ClearResponse): void {
        res.status(404).json({ 
            statusCode: 404, 
            error: "Route not found" 
        });
    }
}
