import { extendResponse } from '../../src/lib/http/response';

describe('UNIT - Response Extension', () => {
    let mockRes: any;

    beforeEach(() => {
        // On simule un objet ServerResponse basique
        mockRes = {
            statusCode: 200,
            setHeader: jest.fn(), // Espion (Spy)
            end: jest.fn()        // Espion (Spy)
        };
    });

    test('should allow chaining .status() and return "this"', () => {
        const response = extendResponse(mockRes);

        // Test du chainage
        const returned = response.status(404);

        // Vérifications
        expect(mockRes.statusCode).toBe(404);
        expect(returned).toBe(response); // C'est ça qui permet de faire .json() juste après
    });

    test('should set header and stringify body with .json()', () => {
        const response = extendResponse(mockRes);
        const data = { id: 1, name: "Test" };

        response.json(data);

        // Vérifie que le header JSON est mis
        expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
        // Vérifie que la réponse est envoyée en string
        expect(mockRes.end).toHaveBeenCalledWith(JSON.stringify(data));
    });

    test('should send raw text with .send()', () => {
        const response = extendResponse(mockRes);

        response.send("Hello World");

        expect(mockRes.end).toHaveBeenCalledWith("Hello World");
    });
});