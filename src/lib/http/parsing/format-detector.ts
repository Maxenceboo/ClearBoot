/**
 * Format detection utilities for request body parsing.
 * Validates and detects content types for proper request processing.
 */

/**
 * Check if a string contains valid JSON.
 * Used for error message parsing and validation.
 * Safely validates JSON format without throwing errors.
 * 
 * @param str - String to validate as JSON
 * @returns true if valid JSON, false otherwise
 * 
 * @example
 * isJson('{"name":"John"}') // true
 * isJson('invalid') // false
 * isJson('') // false
 */
export const isJson = (str: string): boolean => {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
};
