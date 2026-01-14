import * as http from 'http';

/**
 * Parse URL query parameters with support for multiple values.
 * Converts repeated parameters into arrays.
 * 
 * @param url - Parsed URL object
 * @returns Object with query parameters
 */
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

/**
 * Parse cookies from HTTP Cookie header.
 * Automatically decodes URL-encoded values.
 * 
 * @param req - Node.js IncomingMessage
 * @returns Object with cookie name-value pairs
 */
export const parseCookies = (req: http.IncomingMessage): Record<string, string> => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return {};

    const cookies: Record<string, string> = {};
    
    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.split('=');
        if (name && rest.length > 0) {
            cookies[name.trim()] = decodeURIComponent(rest.join('=').trim());
        }
    });

    return cookies;
};
