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

// Lifecycle init contract used by onModuleInit
export interface IModuleInit {
    init(): Promise<void> | void;
}

export type ModuleInitClass = new (...args: any[]) => IModuleInit;