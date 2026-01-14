import * as http from "http";
import {
  BadRequestException,
  PayloadTooLargeException,
} from "../../common/exceptions";

/**
 * Maximum allowed request body size (1MB)
 * Prevents DoS attacks via large payloads
 */
const MAX_BODY_SIZE = 1024 * 1024;

/**
 * Parse JSON request body with security protections.
 * - Enforces 1MB size limit to prevent DoS
 * - Validates JSON format
 * - Returns empty object for empty body
 *
 * @param req - Node.js IncomingMessage
 * @returns Parsed JSON object
 * @throws PayloadTooLargeException if body exceeds 1MB
 * @throws BadRequestException if JSON is malformed
 */
export const parseBody = (req: http.IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = "";
    let totalSize = 0;

    req.on("data", (chunk) => {
      // 1. Sécurité DoS : On vérifie la taille à chaque morceau reçu
      totalSize += chunk.length;

      if (totalSize > MAX_BODY_SIZE) {
        // On coupe la connexion immédiatement pour protéger le serveur
        req.destroy();
        reject(
          new PayloadTooLargeException(
            `Body size limit exceeded (${MAX_BODY_SIZE} bytes)`,
          ),
        );
        return;
      }

      body += chunk.toString();
    });

    req.on("end", () => {
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
        reject(new BadRequestException("Invalid JSON format"));
      }
    });

    req.on("error", (err) => {
      reject(new BadRequestException("Error reading request body"));
    });
  });
};

/**
 * Parse application/x-www-form-urlencoded request body.
 * Supports multiple values for same field name (converted to arrays).
 * Enforces 1MB size limit.
 *
 * @param req - Node.js IncomingMessage
 * @returns Parsed form data object
 * @throws PayloadTooLargeException if body exceeds 1MB
 * @throws BadRequestException on parsing errors
 */
export const parseFormData = (req: http.IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = "";
    let totalSize = 0;

    req.on("data", (chunk) => {
      totalSize += chunk.length;

      if (totalSize > MAX_BODY_SIZE) {
        req.destroy();
        reject(
          new PayloadTooLargeException(
            `Body size limit exceeded (${MAX_BODY_SIZE} bytes)`,
          ),
        );
        return;
      }

      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        if (!body) {
          resolve({});
          return;
        }

        const params: any = {};
        const pairs = body.split("&");

        pairs.forEach((pair) => {
          const [key, value] = pair.split("=");
          if (key) {
            const decodedKey = decodeURIComponent(key);
            const decodedValue = value
              ? decodeURIComponent(value.replace(/\+/g, " "))
              : "";

            // Support pour les champs multiples (ex: tags[]=a&tags[]=b)
            if (params[decodedKey]) {
              if (Array.isArray(params[decodedKey])) {
                params[decodedKey].push(decodedValue);
              } else {
                params[decodedKey] = [params[decodedKey], decodedValue];
              }
            } else {
              params[decodedKey] = decodedValue;
            }
          }
        });

        resolve(params);
      } catch (e) {
        reject(new BadRequestException("Invalid form data format"));
      }
    });

    req.on("error", (err) => {
      reject(new BadRequestException("Error reading form data"));
    });
  });
};
