import * as http from 'http';

export function parseBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch { resolve({}); }
        });
    });
}

export function parseQueryParams(url: URL): any {
    const queryParams: any = {};
    // Gestion correcte des tableaux (tag=a&tag=b)
    url.searchParams.forEach((value, key) => {
        if (queryParams[key] === undefined) {
            queryParams[key] = value;
        } else if (Array.isArray(queryParams[key])) {
            queryParams[key].push(value);
        } else {
            queryParams[key] = [queryParams[key], value];
        }
    });
    return queryParams;
}

export function isJson(str: string) {
    try { JSON.parse(str); return true; } catch { return false; }
}