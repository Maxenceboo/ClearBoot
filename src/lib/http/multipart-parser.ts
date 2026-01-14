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
 * Actual implementations are in focused modules under multipart/ directory.
 * @see multipart/ - All multipart handling
 */

export * from "./multipart";
