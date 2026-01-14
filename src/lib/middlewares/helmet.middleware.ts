import * as http from 'http';
import { IMiddleware } from '../common/interfaces';
import { ClearResponse } from '../http/response';

/**
 * Security middleware providing essential HTTP headers.
 * Implements best practices from Helmet.js for protection against:
 * - MIME type sniffing
 * - Clickjacking (X-Frame-Options)
 * - XSS attacks (X-XSS-Protection)
 * - DNS prefetch leaks
 * - IE8+ direct file opening
 * 
 * @example
 * const server = await ClearBoot.create({
 *   globalMiddlewares: [HelmetMiddleware]
 * });
 */
export class HelmetMiddleware implements IMiddleware {
    /**
     * Apply security headers to HTTP response.
     */
    use(req: http.IncomingMessage, res: ClearResponse, next: () => void) {
        // 1. X-Content-Type-Options: Prevent MIME type sniffing
        // Browsers must respect Content-Type, cannot guess file type
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // 2. X-Frame-Options: Prevent clickjacking
        // Page can only be embedded in frames from same origin
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');

        // 3. X-XSS-Protection: Enable browser XSS filter (legacy, but still useful)
        // Block page if XSS attack detected instead of sanitizing
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // 4. X-DNS-Prefetch-Control: Privacy - prevent DNS prefetch
        // Stops browsers from pre-resolving DNS for links (could leak user browsing)
        res.setHeader('X-DNS-Prefetch-Control', 'off');

        // 5. X-Download-Options: IE8+ security
        // Prevents opening downloaded HTML files directly in IE
        res.setHeader('X-Download-Options', 'noopen');

        // 6. Strict-Transport-Security (HSTS): Force HTTPS (optional)
        // Uncomment if running over HTTPS in production
        // res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');

        next();
    }
}