import { isJson } from '../../src/lib/http/request-utils';

describe('UNIT - Helper Functions', () => {
    test('isJson should return true for valid JSON', () => {
        expect(isJson('{"key": "value"}')).toBe(true);
        expect(isJson('[]')).toBe(true);
        expect(isJson('null')).toBe(true);
        expect(isJson('123')).toBe(true);
        expect(isJson('"string"')).toBe(true);
    });

    test('isJson should return false for invalid JSON', () => {
        expect(isJson('{invalid}')).toBe(false);
        expect(isJson('not json')).toBe(false);
        expect(isJson('{key: value}')).toBe(false);
        expect(isJson('')).toBe(false);
    });
});
