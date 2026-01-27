import 'reflect-metadata';

/**
 * Swagger/OpenAPI decorators for automatic API documentation
 */

/**
 * Document an API endpoint with Swagger metadata
 * @param summary Brief description of what the endpoint does
 * @param description Detailed description
 * 
 * @example
 * ```typescript
 * @Get('/users')
 * @ApiOperation('Get All Users', 'Retrieve a list of all users from database')
 * getAllUsers() { ... }
 * ```
 */
export function ApiOperation(summary: string, description?: string) {
    return (target: any, propertyKey: string) => {
        Reflect.defineMetadata('swagger:operation', { summary, description }, target, propertyKey);
    };
}

/**
 * Document a route parameter
 * @param name Parameter name
 * @param type Data type (string, number, boolean, etc.)
 * @param description Parameter description
 * @param required Whether parameter is required (default: true)
 * 
 * @example
 * ```typescript
 * @Get('/:id')
 * @ApiParam('id', 'string', 'User ID', true)
 * getUser(@Param('id') id: string) { ... }
 * ```
 */
export function ApiParam(name: string, type: string, description?: string, required: boolean = true) {
    return (target: any, propertyKey: string) => {
        const params = Reflect.getOwnMetadata('swagger:params', target, propertyKey) || [];
        params.push({ name, type, description, required });
        Reflect.defineMetadata('swagger:params', params, target, propertyKey);
    };
}

/**
 * Document a query parameter
 * @param name Query parameter name
 * @param type Data type
 * @param description Parameter description
 * @param required Whether parameter is required (default: false)
 * 
 * @example
 * ```typescript
 * @Get('/users')
 * @ApiQuery('limit', 'number', 'Number of users to return', false)
 * getUsers(@Query('limit') limit?: string) { ... }
 * ```
 */
export function ApiQuery(name: string, type: string, description?: string, required: boolean = false) {
    return (target: any, propertyKey: string) => {
        const queries = Reflect.getOwnMetadata('swagger:queries', target, propertyKey) || [];
        queries.push({ name, type, description, required });
        Reflect.defineMetadata('swagger:queries', queries, target, propertyKey);
    };
}

/**
 * Document request body schema
 * @param schema Zod schema or object description
 * @param description Body description
 * 
 * @example
 * ```typescript
 * @Post('/users')
 * @ApiBody(CreateUserSchema, 'New user data')
 * createUser(@Body() body: any) { ... }
 * ```
 */
export function ApiBody(schema: any, description?: string) {
    return (target: any, propertyKey: string) => {
        Reflect.defineMetadata('swagger:body', { schema, description }, target, propertyKey);
    };
}

/**
 * Document possible response with status code and schema
 * @param statusCode HTTP status code (200, 201, 400, etc.)
 * @param description Response description
 * @param schema Response schema or type
 * 
 * @example
 * ```typescript
 * @Get('/users/:id')
 * @ApiResponse(200, 'User found', UserSchema)
 * @ApiResponse(404, 'User not found')
 * getUser(@Param('id') id: string) { ... }
 * ```
 */
export function ApiResponse(statusCode: number, description: string, schema?: any) {
    return (target: any, propertyKey: string) => {
        const responses = Reflect.getOwnMetadata('swagger:responses', target, propertyKey) || [];
        responses.push({ statusCode, description, schema });
        Reflect.defineMetadata('swagger:responses', responses, target, propertyKey);
    };
}

/**
 * Mark endpoint as deprecated
 * @example
 * ```typescript
 * @Get('/old-endpoint')
 * @ApiDeprecated()
 * oldEndpoint() { ... }
 * ```
 */
export function ApiDeprecated() {
    return (target: any, propertyKey: string) => {
        Reflect.defineMetadata('swagger:deprecated', true, target, propertyKey);
    };
}

/**
 * Add tags to group endpoints in Swagger UI (can be used on class or method)
 * @param tags Tag names (e.g., 'Users', 'Products')
 * 
 * @example
 * ```typescript
 * @Controller('/users')
 * @ApiTags('Users')
 * class UserController { ... }
 * ```
 */
export function ApiTags(...tags: string[]) {
    return function (target: any, propertyKey?: string) {
        if (propertyKey) {
            // Method decorator
            Reflect.defineMetadata('swagger:tags', tags, target, propertyKey);
        } else {
            // Class decorator
            Reflect.defineMetadata('swagger:tags', tags, target);
        }
    };
}

/**
 * Document response headers
 * @param name Header name
 * @param type Data type
 * @param description Header description
 * 
 * @example
 * ```typescript
 * @Get('/users')
 * @ApiHeader('X-Total-Count', 'number', 'Total number of users')
 * getUsers() { ... }
 * ```
 */
export function ApiHeader(name: string, type: string, description?: string) {
    return (target: any, propertyKey: string) => {
        const headers = Reflect.getOwnMetadata('swagger:headers', target, propertyKey) || [];
        headers.push({ name, type, description });
        Reflect.defineMetadata('swagger:headers', headers, target, propertyKey);
    };
}

/**
 * Mark endpoint as requiring authentication
 * @param scheme Authentication scheme (Bearer, Basic, etc.)
 * 
 * @example
 * ```typescript
 * @Get('/profile')
 * @ApiSecurity('Bearer')
 * getProfile() { ... }
 * ```
 */
export function ApiSecurity(scheme: string = 'Bearer') {
    return (target: any, propertyKey: string) => {
        Reflect.defineMetadata('swagger:security', scheme, target, propertyKey);
    };
}

/**
 * Mark endpoint as accepting a specific content type
 * @param contentType MIME type (application/json, multipart/form-data, etc.)
 * 
 * @example
 * ```typescript
 * @Post('/upload')
 * @ApiConsumes('multipart/form-data')
 * uploadFile(@Body() file: File) { ... }
 * ```
 */
export function ApiConsumes(contentType: string) {
    return (target: any, propertyKey: string) => {
        Reflect.defineMetadata('swagger:consumes', contentType, target, propertyKey);
    };
}

/**
 * Mark endpoint as producing a specific content type
 * @param contentType MIME type (application/json, text/csv, etc.)
 * 
 * @example
 * ```typescript
 * @Get('/export')
 * @ApiProduces('text/csv')
 * exportUsers() { ... }
 * ```
 */
export function ApiProduces(contentType: string) {
    return (target: any, propertyKey: string) => {
        Reflect.defineMetadata('swagger:produces', contentType, target, propertyKey);
    };
}
