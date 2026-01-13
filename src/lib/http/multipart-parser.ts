import * as http from 'http';
import { BadRequestException, PayloadTooLargeException } from '../common/exceptions';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB par fichier
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB au total

export interface UploadedFile {
    fieldName: string;
    originalName: string;
    mimeType: string;
    size: number;
    buffer: Buffer;
}

export interface MultipartResult {
    fields: Record<string, string | string[]>;
    files: UploadedFile[];
}

/**
 * Parse multipart/form-data (upload de fichiers)
 * ATTENTION: Parser basique, pour production utiliser multer ou busboy
 */
export const parseMultipart = (req: http.IncomingMessage): Promise<MultipartResult> => {
    return new Promise((resolve, reject) => {
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=(.+)$/);

        if (!boundaryMatch) {
            return reject(new BadRequestException('Missing multipart boundary'));
        }

        const boundary = `--${boundaryMatch[1]}`;
        const endBoundary = `${boundary}--`;

        let buffer = Buffer.alloc(0);
        let totalSize = 0;

        req.on('data', (chunk: Buffer) => {
            totalSize += chunk.length;

            if (totalSize > MAX_TOTAL_SIZE) {
                req.destroy();
                return reject(new PayloadTooLargeException(`Total upload size exceeds ${MAX_TOTAL_SIZE} bytes`));
            }

            buffer = Buffer.concat([buffer, chunk]);
        });

        req.on('end', () => {
            try {
                const result = parseMultipartBuffer(buffer, boundary, endBoundary);
                resolve(result);
            } catch (e: any) {
                reject(new BadRequestException(`Multipart parsing error: ${e.message}`));
            }
        });

        req.on('error', () => {
            reject(new BadRequestException('Error reading multipart data'));
        });
    });
};

function parseMultipartBuffer(buffer: Buffer, boundary: string, endBoundary: string): MultipartResult {
    const fields: Record<string, string | string[]> = {};
    const files: UploadedFile[] = [];

    const parts = buffer.toString('binary').split(boundary).slice(1, -1);

    for (const part of parts) {
        if (!part.trim() || part.trim() === '--') continue;

        const [headerSection, ...bodyParts] = part.split('\r\n\r\n');
        const body = bodyParts.join('\r\n\r\n').replace(/\r\n$/, '');

        const headers = parseHeaders(headerSection);
        const disposition = headers['content-disposition'];

        if (!disposition) continue;

        const nameMatch = disposition.match(/name="([^"]+)"/);
        const filenameMatch = disposition.match(/filename="([^"]+)"/);

        if (!nameMatch) continue;

        const fieldName = nameMatch[1];

        if (filenameMatch) {
            // C'est un fichier
            const filename = filenameMatch[1];
            const mimeType = headers['content-type'] || 'application/octet-stream';
            const fileBuffer = Buffer.from(body, 'binary');

            if (fileBuffer.length > MAX_FILE_SIZE) {
                throw new Error(`File ${filename} exceeds ${MAX_FILE_SIZE} bytes`);
            }

            files.push({
                fieldName,
                originalName: filename,
                mimeType,
                size: fileBuffer.length,
                buffer: fileBuffer
            });
        } else {
            // C'est un champ texte
            const value = body.trim();

            if (fields[fieldName]) {
                if (Array.isArray(fields[fieldName])) {
                    (fields[fieldName] as string[]).push(value);
                } else {
                    fields[fieldName] = [fields[fieldName] as string, value];
                }
            } else {
                fields[fieldName] = value;
            }
        }
    }

    return { fields, files };
}

function parseHeaders(headerSection: string): Record<string, string> {
    const headers: Record<string, string> = {};
    const lines = headerSection.split('\r\n').filter(l => l.trim());

    for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length > 0) {
            headers[key.trim().toLowerCase()] = valueParts.join(':').trim();
        }
    }

    return headers;
}
