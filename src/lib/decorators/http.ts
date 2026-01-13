import 'reflect-metadata';

export function HttpCode(code: number) {
    return (t: any, k: string) => Reflect.defineMetadata('http_code', code, t, k);
}

export function Header(key: string, value: string) {
    return (t: any, k: string) => {
        const h = Reflect.getMetadata('response_headers', t, k) || {};
        h[key] = value;
        Reflect.defineMetadata('response_headers', h, t, k);
    };
}
