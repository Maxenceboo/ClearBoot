/**
 * Multipart/form-data parser - centralized re-exports.
 * 
 * This module provides parsing for multipart/form-data requests (file uploads).
 * It aggregates types and parsing logic for convenient access.
 * 
 * **IMPORTANT**: This is a basic parser for educational purposes.
 * For production use, prefer battle-tested libraries like `multer` or `busboy`.
 * 
 * Security limits:
 * - 10MB per file
 * - 50MB total upload size
 * 
 * Actual implementations are in focused modules:
 * @see multipart-types.ts - Type definitions (UploadedFile, MultipartResult)
 * @see multipart-processor.ts - Parsing and validation logic
 */

export { parseMultipart } from './multipart-processor';
export { UploadedFile, MultipartResult } from './multipart-types';
