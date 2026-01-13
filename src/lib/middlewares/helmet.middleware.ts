import * as http from 'http';
import { IMiddleware } from '../common/interfaces';
import { ClearResponse } from '../http/response';

export class HelmetMiddleware implements IMiddleware {
    use(req: http.IncomingMessage, res: ClearResponse, next: () => void) {
        // 1. Anti-Sniffing : Empêche le navigateur de deviner le type de fichier
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // 2. Anti-Clickjacking : Empêche d'afficher ton site dans une <iframe> ailleurs
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');

        // 3. Anti-XSS (Ancien mais utile) : Active le filtre XSS du navigateur
        res.setHeader('X-XSS-Protection', '1; mode=block');

        // 4. DNS Prefetch : Évite que le navigateur fasse des requêtes DNS préventives (vie privée)
        res.setHeader('X-DNS-Prefetch-Control', 'off');

        // 5. Téléchargement IE8+ : Empêche l'ouverture directe de fichiers HTML téléchargés
        res.setHeader('X-Download-Options', 'noopen');

        // 6. HSTS : Force le HTTPS (Optionnel, utile seulement si tu es en HTTPS)
        // res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');

        next();
    }
}