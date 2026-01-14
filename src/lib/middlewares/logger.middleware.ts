import * as http from 'http';
import { IMiddleware } from '../common/interfaces';

/**
 * Logger middleware.
 * Logs all HTTP requests with method, URL, status code, and duration.
 */
export class LoggerMiddleware implements IMiddleware {
    /**
     * Log HTTP request and response.
     * Tracks request start time and logs on response finish with duration.
     */
    use(req: http.IncomingMessage, res: http.ServerResponse, next: () => void) {
        const start = Date.now();
        const { method, url } = req;

        // Log when response finishes
        res.on('finish', () => {
            const duration = Date.now() - start;
            const statusCode = res.statusCode;

            // Format: 📝 [METHOD] /path - statusCode (duration ms)
            console.log(`📝 [${method}] ${url} - ${statusCode} (${duration}ms)`);
        });

        next();
    }
}