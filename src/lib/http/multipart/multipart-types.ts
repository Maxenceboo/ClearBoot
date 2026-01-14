/**
 * Multipart/form-data type definitions for file uploads.
 * Represents uploaded files and form fields from multipart requests.
 */

/**
 * Represents an uploaded file from multipart/form-data request
 * 
 * @property fieldName - Form field name
 * @property originalName - Original filename from client
 * @property mimeType - MIME type (e.g., 'image/png')
 * @property size - File size in bytes
 * @property buffer - File content as Buffer
 * 
 * @example
 * const file: UploadedFile = {
 *   fieldName: 'avatar',
 *   originalName: 'photo.jpg',
 *   mimeType: 'image/jpeg',
 *   size: 2048,
 *   buffer: Buffer.from(...)
 * }
 */
export interface UploadedFile {
    fieldName: string;
    originalName: string;
    mimeType: string;
    size: number;
    buffer: Buffer;
}

/**
 * Result of multipart parsing containing fields and files
 * 
 * @property fields - Text fields from the form (supports multiple values as arrays)
 * @property files - Uploaded files array
 * 
 * @example
 * const result: MultipartResult = {
 *   fields: { name: 'John', tags: ['javascript', 'typescript'] },
 *   files: [{ fieldName: 'avatar', ... }]
 * }
 */
export interface MultipartResult {
    fields: Record<string, string | string[]>;
    files: UploadedFile[];
}
