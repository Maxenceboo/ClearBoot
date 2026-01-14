/**
 * Base HTTP exception class.
 * All HTTP errors should extend this for consistent error handling.
 * Stores HTTP status code and error message.
 * 
 * @example
 * throw new HttpException('Resource not found', 404);
 */
export class HttpException extends Error {
    /**
     * Create HTTP exception.
     * @param message - Error message
     * @param status - HTTP status code (400, 404, 500, etc.)
     */
    constructor(public message: string, public status: number) {
        super(message);
        // Required for instanceof checks to work correctly after TS compilation
        Object.setPrototypeOf(this, HttpException.prototype);
    }
}

/**
 * 400 Bad Request Exception.
 * Thrown when request data is invalid or malformed.
 * 
 * @example
 * throw new BadRequestException('Email is invalid');
 */
export class BadRequestException extends HttpException {
    constructor(message: string = 'Bad Request') {
        super(message, 400);
    }
}

/**
 * 401 Unauthorized Exception.
 * Thrown when authentication is required but not provided.
 * 
 * @example
 * throw new UnauthorizedException('Invalid credentials');
 */
export class UnauthorizedException extends HttpException {
    constructor(message: string = 'Unauthorized') {
        super(message, 401);
    }
}

/**
 * 403 Forbidden Exception.
 * Thrown when user is authenticated but doesn't have permission.
 * 
 * @example
 * throw new ForbiddenException('You do not have access to this resource');
 */
export class ForbiddenException extends HttpException {
    constructor(message: string = 'Forbidden') {
        super(message, 403);
    }
}

/**
 * 404 Not Found Exception.
 * Thrown when requested resource doesn't exist.
 * 
 * @example
 * throw new NotFoundException('User not found');
 */
export class NotFoundException extends HttpException {
    constructor(message: string = 'Not Found') {
        super(message, 404);
    }
}

/**
 * 500 Internal Server Error Exception.
 * Thrown for unexpected server-side errors.
 * 
 * @example
 * throw new InternalServerErrorException('Database connection failed');
 */
export class InternalServerErrorException extends HttpException {
    constructor(message: string = 'Internal Server Error') {
        super(message, 500);
    }
}

/**
 * 413 Payload Too Large Exception.
 * Thrown when request body exceeds maximum allowed size.
 * 
 * @example
 * throw new PayloadTooLargeException('File upload exceeds 10MB limit');
 */
export class PayloadTooLargeException extends HttpException {
    constructor(message: string = 'Payload Too Large') {
        super(message, 413);
    }
}