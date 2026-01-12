import * as http from 'http';

// L'interface qui étend celle de base de Node.js
export interface ClearResponse extends http.ServerResponse {
    status(code: number): this; // 'this' permet de chainer .status().json()
    json(data: any): void;
    send(data: string): void;
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

    return extended;
}