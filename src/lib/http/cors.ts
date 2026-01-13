import * as http from 'http';
import { ClearResponse } from './response';

export interface CorsOptions {
    origin?: string | string[] | boolean; // 'http://site.com', ['http://a.com', 'http://b.com'], ou true (reflect)
    methods?: string[]; // ['GET', 'POST']
    allowedHeaders?: string[]; // ['Content-Type', 'Authorization']
    credentials?: boolean; // true pour accepter les cookies
    maxAge?: number; // Cache du preflight en secondes
}

export function applyCors(req: http.IncomingMessage, res: ClearResponse, options?: CorsOptions) {
    if (!options) return; // Si pas de config, on ne fait rien (ou on laisse le défaut)

    const reqOrigin = req.headers.origin;

    // 1. GESTION DE L'ORIGINE (Qui a le droit ?)
    if (options.origin === true && reqOrigin) {
        // Mode miroir : on accepte tout le monde mais on renvoie l'origine exacte (requis pour credentials)
        res.setHeader('Access-Control-Allow-Origin', reqOrigin);
    } else if (typeof options.origin === 'string') {
        // Une seule origine autorisée
        res.setHeader('Access-Control-Allow-Origin', options.origin);
    } else if (Array.isArray(options.origin) && reqOrigin) {
        // Liste blanche : on vérifie si l'origine est dedans
        if (options.origin.includes(reqOrigin)) {
            res.setHeader('Access-Control-Allow-Origin', reqOrigin);
        }
    } else {
        // Par défaut : Tout le monde
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    // 2. CREDENTIALS (Cookies / Auth)
    if (options.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // 3. METHODES AUTORISÉES
    const methods = options.methods || ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'];
    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));

    // 4. HEADERS AUTORISÉS
    const headers = options.allowedHeaders || ['Content-Type', 'Authorization', 'X-Requested-With'];
    res.setHeader('Access-Control-Allow-Headers', headers.join(', '));

    // 5. CACHE (Pour éviter de refaire OPTIONS à chaque fois)
    if (options.maxAge) {
        res.setHeader('Access-Control-Max-Age', options.maxAge.toString());
    }
}