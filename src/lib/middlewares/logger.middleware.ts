import * as http from 'http';
import { IMiddleware } from '../common/interfaces'; // 👈 Chemin relatif interne à la lib

export class LoggerMiddleware implements IMiddleware {
    use(req: http.IncomingMessage, res: http.ServerResponse, next: () => void) {
        const start = Date.now();
        const { method, url } = req;

        res.on('finish', () => {
            const duration = Date.now() - start;
            const statusCode = res.statusCode;

            // On peut ajouter de la couleur si on veut faire "pro"
            console.log(`📝 [${method}] ${url} - ${statusCode} (${duration}ms)`);
        });

        next();
    }
}