import * as http from 'http';
import { ClearResponse } from '../http/response';

export interface IMiddleware {
    // 👇 Le type de 'res' a changé ici
    use(req: http.IncomingMessage, res: ClearResponse, next: () => void): void;
}

export type MiddlewareClass = new (...args: any[]) => IMiddleware;