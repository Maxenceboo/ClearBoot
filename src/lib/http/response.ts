import * as http from 'http';

/**
 * Cookie configuration options for security and behavior control
 */
export interface CookieOptions {
    /** Duration in milliseconds (e.g., 3600000 for 1 hour) */
    maxAge?: number;
    /** Absolute expiration date */
    expires?: Date;
    /** If true, cookie not accessible via JavaScript (XSS protection) */
    httpOnly?: boolean;
    /** If true, cookie only sent over HTTPS */
    secure?: boolean;
    /** CSRF protection: 'Strict' | 'Lax' | 'None' */
    sameSite?: 'Strict' | 'Lax' | 'None';
    /** Cookie path (default: '/') */
    path?: string;
    /** Cookie domain */
    domain?: string;
}

/**
 * Extended HTTP response with convenient helper methods.
 * Extends Node.js ServerResponse with Express-like API.
 */
export interface ClearResponse extends http.ServerResponse {
    /** Set HTTP status code (chainable) */
    status(code: number): this;
    /** Send JSON response */
    json(data: any): void;
    /** Send plain text response */
    send(data: string): void;
    /** Set a cookie (chainable) */
    cookie(name: string, value: string, options?: CookieOptions): this;
    /** Clear a cookie (chainable) */
    clearCookie(name: string, options?: CookieOptions): this;
}

/**
 * Extend Node.js ServerResponse with ClearBoot helper methods.
 * Adds .status(), .json(), .send(), .cookie(), .clearCookie()
 * 
 * @param res - Standard Node.js ServerResponse
 * @returns Extended response with helper methods
 */
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