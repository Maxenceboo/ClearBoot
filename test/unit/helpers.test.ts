import { parseQueryParams } from '../../src/lib/http/request-utils';

describe('UNIT - Helper Functions', () => {
    test('parseQueryParams should parse single param', () => {
        const params = parseQueryParams(new URL('http://localhost?name=john'));
        expect(params.name).toBe('john');
    });

    test('parseQueryParams should parse multiple params', () => {
        const params = parseQueryParams(new URL('http://localhost?name=john&age=30'));
        expect(params.name).toBe('john');
        expect(params.age).toBe('30');
    });

    test('parseQueryParams should handle array params', () => {
        const params = parseQueryParams(new URL('http://localhost?tags=a&tags=b'));
        expect(Array.isArray(params.tags)).toBe(true);
        expect(params.tags).toContain('a');
        expect(params.tags).toContain('b');
    });

    test('parseQueryParams should return empty object for no query', () => {
        const params = parseQueryParams(new URL('http://localhost'));
        expect(Object.keys(params).length).toBe(0);
    });
});
