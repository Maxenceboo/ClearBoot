import * as http from 'http';
import { BadRequestException, PayloadTooLargeException } from '../common/exceptions';

// Limite de taille par défaut (1MB) - Suffisant pour du JSON standard
const MAX_BODY_SIZE = 1024 * 1024;

export const parseBody = (req: http.IncomingMessage): Promise<any> => {
    return new Promise((resolve, reject) => {
        let body = '';
        let totalSize = 0;

        req.on('data', (chunk) => {
            // 1. Sécurité DoS : On vérifie la taille à chaque morceau reçu
            totalSize += chunk.length;

            if (totalSize > MAX_BODY_SIZE) {
                // On coupe la connexion immédiatement pour protéger le serveur
                req.destroy();
                reject(new PayloadTooLargeException(`Body size limit exceeded (${MAX_BODY_SIZE} bytes)`));
                return;
            }

            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                // Si le body est vide, on renvoie un objet vide
                if (!body) {
                    resolve({});
                    return;
                }

                // 2. Sécurité Parsing : On enveloppe le parse dans un try-catch
                const parsed = JSON.parse(body);
                resolve(parsed);
            } catch (e) {
                // Si le JSON est mal formé, on rejette proprement
                reject(new BadRequestException('Invalid JSON format'));
            }
        });

        req.on('error', (err) => {
            reject(new BadRequestException('Error reading request body'));
        });
    });
};

export const parseQueryParams = (url: URL): any => {
    const params: any = {};
    url.searchParams.forEach((value, key) => {
        if (params[key]) {
            // Si la clé existe déjà
            if (Array.isArray(params[key])) {
                // C'est déjà un tableau, on ajoute
                params[key].push(value);
            } else {
                // C'était une string, on transforme en tableau
                params[key] = [params[key], value];
            }
        } else {
            // Première fois qu'on voit la clé
            params[key] = value;
        }
    });
    return params;
};

// Utilitaire pour vérifier si c'est une erreur JSON (utile dans le handler)
export const isJson = (str: string) => {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
};