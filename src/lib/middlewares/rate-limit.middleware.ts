import * as http from 'http';
import { IMiddleware } from '../common/interfaces';

export class RateLimitMiddleware implements IMiddleware {
    // On stocke les hits en mémoire (Pour un gros projet, on utiliserait Redis)
    private clients = new Map<string, { count: number, resetTime: number }>();

    private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    private readonly MAX_REQUESTS = 100;         // Max 100 requêtes par fenêtre

    use(req: http.IncomingMessage, res: http.ServerResponse, next: () => void) {
        const ip = req.socket.remoteAddress || 'unknown';
        const now = Date.now();

        if (!this.clients.has(ip)) {
            this.clients.set(ip, { count: 1, resetTime: now + this.WINDOW_MS });
        } else {
            const data = this.clients.get(ip)!;

            // Si la fenêtre est expirée, on reset
            if (now > data.resetTime) {
                data.count = 1;
                data.resetTime = now + this.WINDOW_MS;
            } else {
                data.count++;
            }

            // Si dépassement, on bloque avec une erreur 429
            if (data.count > this.MAX_REQUESTS) {
                res.writeHead(429, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    statusCode: 429,
                    error: 'Too Many Requests',
                    message: `Retry after ${Math.round((data.resetTime - now) / 1000)}s`
                }));
                return;
            }
        }

        // Headers standards pour informer le client
        const clientData = this.clients.get(ip)!;
        res.setHeader('X-RateLimit-Limit', this.MAX_REQUESTS);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, this.MAX_REQUESTS - clientData.count));

        next();
    }
}