import { parseQueryParams } from '../../src/lib/http/request-utils';

describe('UNIT - HTTP Utils', () => {

    test('Doit parser des query params simples', () => {
        const url = new URL('http://localhost/?page=1&sort=asc');
        const params = parseQueryParams(url);
        expect(params).toEqual({ page: '1', sort: 'asc' });
    });

    test('Doit gérer les tableaux (Cas n°6)', () => {
        const url = new URL('http://localhost/?tag=tech&tag=news&tag=code');
        const params = parseQueryParams(url);

        // C'est ici qu'on vérifie ta correction sur le Cas 6
        expect(Array.isArray(params.tag)).toBe(true);
        expect(params.tag).toEqual(['tech', 'news', 'code']);
    });

    test('Doit gérer le mélange string et tableau', () => {
        const url = new URL('http://localhost/?id=10&opt=a&opt=b');
        const params = parseQueryParams(url);

        expect(params.id).toBe('10');
        expect(params.opt).toEqual(['a', 'b']);
    });
});