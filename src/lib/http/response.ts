import * as http from 'http';

export interface CookieOptions {
    maxAge?: number;      // Durée en millisecondes
    expires?: Date;       // Date d'expiration
    httpOnly?: boolean;   // Accessible uniquement via HTTP (pas JavaScript)
    secure?: boolean;     // Seulement HTTPS
    sameSite?: 'Strict' | 'Lax' | 'None';
    path?: string;        // Chemin du cookie
    domain?: string;      // Domaine du cookie
}

// L'interface qui étend celle de base de Node.js
export interface ClearResponse extends http.ServerResponse {
    status(code: number): this; // 'this' permet de chainer .status().json()
    json(data: any): void;
    send(data: string): void;
    cookie(name: string, value: string, options?: CookieOptions): this;
    clearCookie(name: string, options?: CookieOptions): this;
}

// La fonction magique qui transforme le 'res' basique
export function extendResponse(res: http.ServerResponse): ClearResponse {
    const extended = res as ClearResponse;

    // Implémentation de .status()
    extended.status = function (code: number) {
        this.statusCode = code;
        return this;
    };

    // Implémentation de .json()
    extended.json = function (data: any) {
        this.setHeader('Content-Type', 'application/json');
        this.end(JSON.stringify(data));
    };

    // Implémentation de .send()
    extended.send = function (data: string) {
        this.end(data);
    };

    // Implémentation de .cookie()
    extended.cookie = function (name: string, value: string, options: CookieOptions = {}) {
        let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

        if (options.maxAge) {
            cookieString += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
        }

        if (options.expires) {
            cookieString += `; Expires=${options.expires.toUTCString()}`;
        }

        if (options.httpOnly) {
            cookieString += '; HttpOnly';
        }

        if (options.secure) {
            cookieString += '; Secure';
        }

        if (options.sameSite) {
            cookieString += `; SameSite=${options.sameSite}`;
        }

        if (options.path) {
            cookieString += `; Path=${options.path}`;
        } else {
            cookieString += '; Path=/';
        }

        if (options.domain) {
            cookieString += `; Domain=${options.domain}`;
        }

        // Ajouter le cookie au header (supporte plusieurs Set-Cookie)
        const existing = this.getHeader('Set-Cookie') || [];
        const cookies: string[] = Array.isArray(existing) 
            ? existing.map(c => String(c))
            : [String(existing)];
        cookies.push(cookieString);
        this.setHeader('Set-Cookie', cookies);

        return this;
    };

    // Implémentation de .clearCookie()
    extended.clearCookie = function (name: string, options: CookieOptions = {}) {
        return this.cookie(name, '', {
            ...options,
            expires: new Date(0)
        });
    };

    return extended;
}