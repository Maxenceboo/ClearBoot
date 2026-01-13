import request from 'supertest';
import * as http from 'http';
import { ClearBoot, Controller, Post, Req, Body } from '../../src/lib/index';

@Controller('/upload')
class UploadController {
    @Post('/file')
    uploadFile(@Req() req: any, @Body() fields: any) {
        const files = req.files || [];
        return {
            fields,
            files: files.map((f: any) => ({
                name: f.originalName,
                size: f.size,
                type: f.mimeType
            }))
        };
    }
}

describe('INTEGRATION - File Upload (Multipart)', () => {
    let server: http.Server;

    beforeAll(async () => {
        server = await ClearBoot.create({ port: 0 });
    });

    afterAll((done) => {
        server.close(done);
    });

    test('POST /upload/file - devrait parser multipart/form-data avec fichier', async () => {
        const res = await request(server)
            .post('/upload/file')
            .field('title', 'Mon Document')
            .field('description', 'Test upload')
            .attach('document', Buffer.from('Hello World'), 'test.txt');

        expect(res.status).toBe(200);
        expect(res.body.fields).toEqual({
            title: 'Mon Document',
            description: 'Test upload'
        });
        expect(res.body.files).toHaveLength(1);
        expect(res.body.files[0].name).toBe('test.txt');
        expect(res.body.files[0].size).toBeGreaterThan(0);
    });

    test('POST /upload/file - devrait accepter plusieurs fichiers', async () => {
        const res = await request(server)
            .post('/upload/file')
            .attach('file1', Buffer.from('Content 1'), 'file1.txt')
            .attach('file2', Buffer.from('Content 2'), 'file2.txt');

        expect(res.status).toBe(200);
        expect(res.body.files).toHaveLength(2);
        expect(res.body.files[0].name).toBe('file1.txt');
        expect(res.body.files[1].name).toBe('file2.txt');
    });

    test('POST /upload/file - devrait accepter multipart sans fichiers', async () => {
        const res = await request(server)
            .post('/upload/file')
            .field('name', 'Test')
            .field('email', 'test@example.com');

        expect(res.status).toBe(200);
        expect(res.body.fields).toEqual({
            name: 'Test',
            email: 'test@example.com'
        });
        expect(res.body.files).toHaveLength(0);
    });

    test('POST /upload/file - devrait gérer les champs multiples en multipart', async () => {
        const res = await request(server)
            .post('/upload/file')
            .field('tags', 'tag1')
            .field('tags', 'tag2')
            .field('tags', 'tag3');

        expect(res.status).toBe(200);
        expect(res.body.fields.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });

    test('POST /upload/file - devrait rejeter un fichier trop gros (>10MB)', async () => {
        const bigBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB

        const res = await request(server)
            .post('/upload/file')
            .attach('bigfile', bigBuffer, 'huge.bin');

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Multipart parsing error');
    });
});
