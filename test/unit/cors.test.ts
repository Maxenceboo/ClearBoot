import { applyCors, CorsOptions } from '../../src/lib/http/cors';

describe('UNIT - CORS Logic', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
        // On reset les mocks avant chaque test
        mockReq = {
            headers: {
                origin: 'http://mon-site.com'
            }
        };

        mockRes = {
            setHeader: jest.fn() // On espionne cette fonction
        };
    });

    test('Doit ne rien faire si aucune option n\'est passée', () => {
        applyCors(mockReq, mockRes, undefined);
        expect(mockRes.setHeader).not.toHaveBeenCalled();
    });

    test('Doit mettre "*" si origin n\'est pas défini dans les options', () => {
        const options: CorsOptions = {}; // Vide
        applyCors(mockReq, mockRes, options);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    });

    test('Doit accepter une String unique', () => {
        const options: CorsOptions = { origin: 'http://google.com' };
        applyCors(mockReq, mockRes, options);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://google.com');
    });

    test('Doit refléter l\'origine si origin: true (Mirror)', () => {
        const options: CorsOptions = { origin: true };
        applyCors(mockReq, mockRes, options);

        // Comme req.headers.origin vaut 'http://mon-site.com', le header doit valoir pareil
        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://mon-site.com');
    });

    test('Doit accepter une liste (Array) si l\'origine est dedans', () => {
        const options: CorsOptions = {
            origin: ['http://autre.com', 'http://mon-site.com']
        };
        applyCors(mockReq, mockRes, options);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://mon-site.com');
    });

    test('Ne doit RIEN mettre si l\'origine n\'est pas dans la liste (Array)', () => {
        const options: CorsOptions = {
            origin: ['http://prive.com']
        };
        // Notre mockReq vient de "mon-site.com", donc ça ne doit pas matcher
        applyCors(mockReq, mockRes, options);

        // On ne doit PAS avoir défini le header Origin
        expect(mockRes.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', expect.anything());
    });

    test('Doit gérer les Credentials et Methods', () => {
        const options: CorsOptions = {
            origin: 'http://test.com',
            credentials: true,
            methods: ['GET', 'POST']
        };
        applyCors(mockReq, mockRes, options);

        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Credentials', 'true');
        expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST');
    });
});