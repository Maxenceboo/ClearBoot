import * as http from 'http';
import { ClearResponse } from './response';
import { logger } from '../common/logger';

/**
 * CORS (Cross-Origin Resource Sharing) configuration options.
 */
export interface CorsOptions {
    /**
     * Allowed origin(s).
     * - string: Single origin ('http://localhost:3000')
     * - string[]: Whitelist of origins
     * - true: Reflect requesting origin (accept all, use with credentials)
     * - false/undefined: No CORS (default: '*')
     */
    origin?: string | string[] | boolean;
    
    /**
     * Allowed HTTP methods (default: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'])
     */
    methods?: string[];
    
    /**
     * Allowed request headers (default: ['Content-Type', 'Authorization', 'X-Requested-With'])
     */
    allowedHeaders?: string[];
    
    /**
     * Allow credentials (cookies, auth) in cross-origin requests (default: false)
     * Must use specific origin (not '*') when true
     */
    credentials?: boolean;
    
    /**
     * Browser cache duration for preflight responses in seconds (default: no cache header)
     */
    maxAge?: number;
}

/**
 * Apply CORS headers to HTTP response.
 * Handles preflight requests and sets appropriate Access-Control-* headers.
 * 
 * @param req - Incoming HTTP request
 * @param res - HTTP response to add headers to
 * @param options - CORS configuration
 */
export function applyCors(req: http.IncomingMessage, res: ClearResponse, options?: CorsOptions) {
    // Skip CORS processing if no options provided
    if (!options) return;

    const reqOrigin = req.headers.origin;

    // 1. Handle allowed origin(s)
    if (options.origin === true && reqOrigin) {
        // Reflect mode: accept all origins, echo requesting origin (required for credentials)
        res.setHeader('Access-Control-Allow-Origin', reqOrigin);
    } else if (typeof options.origin === 'string') {
        // Single origin allowed
        res.setHeader('Access-Control-Allow-Origin', options.origin);
    } else if (Array.isArray(options.origin) && reqOrigin) {
        // Whitelist: verify origin in list
        if (options.origin.includes(reqOrigin)) {
            res.setHeader('Access-Control-Allow-Origin', reqOrigin);
        } else {
            logger.info(`🌐 CORS blocked origin: ${reqOrigin}`);
        }
    } else {
        // Default: allow all origins
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // 2. Allow credentials (cookies, Authorization header)
    if (options.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // 3. Allowed HTTP methods
    const methods = options.methods || ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'];
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));

    // 4. Allowed request headers
    const headers = options.allowedHeaders || ['Content-Type', 'Authorization', 'X-Requested-With'];
    res.setHeader('Access-Control-Allow-Headers', headers.join(', '));

    // 5. Cache preflight response (to avoid OPTIONS on every request)
    if (options.maxAge) {
        res.setHeader('Access-Control-Max-Age', options.maxAge.toString());
    }
}