/**
 * Request utility functions - centralized re-exports.
 * 
 * This module aggregates HTTP request parsing utilities for convenient access:
 * - Body parsing (JSON, form data)
 * - Query parameters and cookies
 * - Format detection
 * 
 * Actual implementations are in focused modules under parsing/ directory.
 * @see parsing/ - All HTTP parsing utilities
 */

export * from './parsing';