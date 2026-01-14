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
 */
export interface MultipartResult {
  fields: Record<string, string | string[]>;
  files: UploadedFile[];
}
