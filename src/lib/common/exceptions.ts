export class HttpException extends Error {
    constructor(public message: string, public status: number) {
        super(message);
        // Nécessaire pour que instanceof fonctionne correctement en TS après compilation
        Object.setPrototypeOf(this, HttpException.prototype);
    }
}

// 400 - Mauvaise Requête
export class BadRequestException extends HttpException {
    constructor(message: string = 'Bad Request') {
        super(message, 400);
    }
}

// 401 - Non Autorisé
export class UnauthorizedException extends HttpException {
    constructor(message: string = 'Unauthorized') {
        super(message, 401);
    }
}

// 403 - Interdit
export class ForbiddenException extends HttpException {
    constructor(message: string = 'Forbidden') {
        super(message, 403);
    }
}

// 404 - Non Trouvé
export class NotFoundException extends HttpException {
    constructor(message: string = 'Not Found') {
        super(message, 404);
    }
}

// 500 - Erreur Interne (optionnel, souvent par défaut)
export class InternalServerErrorException extends HttpException {
    constructor(message: string = 'Internal Server Error') {
        super(message, 500);
    }
}

// 413 - Payload Too Large (Trop de données)
export class PayloadTooLargeException extends HttpException {
    constructor(message: string = 'Payload Too Large') {
        super(message, 413);
    }
}