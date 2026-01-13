import * as http from 'http';
import { ClearResponse } from '../http/response';

export interface IMiddleware {
    // 👇 Le type de 'res' a changé ici
    use(req: http.IncomingMessage, res: ClearResponse, next: () => void): void;
}

export interface IHeaderProvider {
    getHeaders(): Record<string, string>;
}

export type MiddlewareClass = new (...args: any[]) => IMiddleware;
export type HeaderProviderClass = new (...args: any[]) => IHeaderProvider;