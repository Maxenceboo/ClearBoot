import 'reflect-metadata';
import * as http from 'http';

/**
 * OpenAPI/Swagger generator that extracts metadata from decorators
 * and generates OpenAPI 3.0 specification
 */
export class SwaggerGenerator {
    /**
     * Generate OpenAPI 3.0 specification from controller metadata
     */
    static generateSpec(config: SwaggerConfig, controllers: any[]): OpenAPISpec {
        const paths: Record<string, any> = {};
        const tags: Set<string> = new Set();

        for (const controller of controllers) {
            const instance = new controller();
            const controllerPath = Reflect.getMetadata('controller:path', controller) || '';
            const controllerTags = Reflect.getMetadata('swagger:tags', controller) || [];

            // Add controller tags
            controllerTags.forEach((t: string) => tags.add(t));

            const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance));

            for (const method of methods) {
                const route = Reflect.getMetadata('route:verb', instance, method);
                if (!route) continue;

                const methodTags = Reflect.getMetadata('swagger:tags', instance, method) || controllerTags;
                methodTags.forEach((t: string) => tags.add(t));

                const fullPath = controllerPath + route.path;
                const verb = route.verb.toLowerCase();

                if (!paths[fullPath]) {
                    paths[fullPath] = {};
                }

                paths[fullPath][verb] = this.buildPathItem(instance, method, methodTags);
            }
        }

        return {
            openapi: '3.0.0',
            info: {
                title: config.title,
                description: config.description,
                version: config.version,
                contact: config.contact,
                license: config.license,
            },
            servers: config.servers || [{ url: 'http://localhost:3000', description: 'Development' }],
            paths,
            components: {
                securitySchemes: {
                    Bearer: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
            tags: Array.from(tags).map(tag => ({ name: tag })),
        };
    }

    private static buildPathItem(instance: any, methodName: string, defaultTags?: string[]): OpenAPIPathItem {
        const operation = Reflect.getMetadata('swagger:operation', instance, methodName) || {};
        const params = Reflect.getMetadata('swagger:params', instance, methodName) || [];
        const queries = Reflect.getMetadata('swagger:queries', instance, methodName) || [];
        const body = Reflect.getMetadata('swagger:body', instance, methodName);
        const responses = Reflect.getMetadata('swagger:responses', instance, methodName) || [];
        const headers = Reflect.getMetadata('swagger:headers', instance, methodName) || [];
        const tags = Reflect.getMetadata('swagger:tags', instance, methodName) || defaultTags || [];
        const security = Reflect.getMetadata('swagger:security', instance, methodName);
        const deprecated = Reflect.getMetadata('swagger:deprecated', instance, methodName) || false;
        const consumes = Reflect.getMetadata('swagger:consumes', instance, methodName);
        const produces = Reflect.getMetadata('swagger:produces', instance, methodName);

        const pathItem: OpenAPIPathItem = {
            summary: operation.summary,
            description: operation.description,
            tags,
            deprecated,
            parameters: [],
            responses: {},
        };

        // Add path parameters
        for (const param of params) {
            pathItem.parameters!.push({
                name: param.name,
                in: 'path',
                required: param.required !== false,
                schema: { type: param.type },
                description: param.description,
            });
        }

        // Add query parameters
        for (const query of queries) {
            pathItem.parameters!.push({
                name: query.name,
                in: 'query',
                required: query.required || false,
                schema: { type: query.type },
                description: query.description,
            });
        }

        // Add response headers
        if (headers.length > 0) {
            const headersObj: Record<string, any> = {};
            for (const header of headers) {
                headersObj[header.name] = {
                    schema: { type: header.type },
                    description: header.description,
                };
            }
        }

        // Add request body
        if (body) {
            pathItem.requestBody = {
                description: body.description || 'Request body',
                required: true,
                content: {
                    [consumes || 'application/json']: {
                        schema: body.schema ? this.schemaToOpenAPI(body.schema) : { type: 'object' },
                    },
                },
            };
        }

        // Add responses
        if (responses.length > 0) {
            for (const response of responses) {
                pathItem.responses![response.statusCode.toString()] = {
                    description: response.description,
                    content: response.schema ? {
                        [produces || 'application/json']: {
                            schema: this.schemaToOpenAPI(response.schema),
                        },
                    } : undefined,
                };
            }
        } else {
            // Default success response
            pathItem.responses!['200'] = {
                description: 'Successful response',
            };
        }

        // Add security if required
        if (security) {
            pathItem.security = [{ [security]: [] }];
        }

        return pathItem;
    }

    /**
     * Convert Zod schema to OpenAPI schema
     */
    private static schemaToOpenAPI(schema: any): any {
        if (!schema) return { type: 'object' };

        // If it's a Zod schema
        if (schema._def) {
            const def = schema._def;

            // z.object
            if (def.typeName === 'ZodObject') {
                const properties: Record<string, any> = {};
                const required: string[] = [];

                for (const [key, value] of Object.entries(def.shape())) {
                    const fieldSchema = value as any;
                    properties[key] = this.schemaToOpenAPI(fieldSchema);
                    if (fieldSchema._def?.typeName !== 'ZodOptional') {
                        required.push(key);
                    }
                }

                return { type: 'object', properties, required };
            }

            // z.string
            if (def.typeName === 'ZodString') {
                return { type: 'string' };
            }

            // z.number
            if (def.typeName === 'ZodNumber') {
                return { type: 'number' };
            }

            // z.boolean
            if (def.typeName === 'ZodBoolean') {
                return { type: 'boolean' };
            }

            // z.array
            if (def.typeName === 'ZodArray') {
                return {
                    type: 'array',
                    items: this.schemaToOpenAPI(def.type),
                };
            }

            // z.optional
            if (def.typeName === 'ZodOptional') {
                return this.schemaToOpenAPI(def.innerType);
            }

            // z.enum
            if (def.typeName === 'ZodEnum') {
                return { type: 'string', enum: def.values };
            }
        }

        return { type: 'object' };
    }
}

/**
 * Swagger configuration options
 */
export interface SwaggerConfig {
    title: string;
    description?: string;
    version: string;
    contact?: {
        name?: string;
        url?: string;
        email?: string;
    };
    license?: {
        name: string;
        url?: string;
    };
    servers?: Array<{
        url: string;
        description?: string;
    }>;
}

/**
 * OpenAPI 3.0 specification structure
 */
export interface OpenAPISpec {
    openapi: string;
    info: {
        title: string;
        description?: string;
        version: string;
        contact?: any;
        license?: any;
    };
    servers?: Array<{
        url: string;
        description?: string;
    }>;
    paths: Record<string, any>;
    components?: {
        securitySchemes?: Record<string, any>;
    };
    tags?: Array<{ name: string; description?: string }>;
}

/**
 * OpenAPI path item (single endpoint)
 */
export interface OpenAPIPathItem {
    summary?: string;
    description?: string;
    tags?: string[];
    deprecated?: boolean;
    parameters?: any[];
    requestBody?: any;
    responses?: Record<string, any>;
    security?: any[];
}

/**
 * Swagger middleware to serve Swagger UI
 */
export function createSwaggerUI(spec: OpenAPISpec) {
    return (req: http.IncomingMessage, res: http.ServerResponse) => {
        const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>${spec.info.title}</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui.css">
  </head>
  <body>
    <swagger-ui spec='${JSON.stringify(spec)}'></swagger-ui>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({
        spec: ${JSON.stringify(spec)},
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
    </script>
  </body>
</html>
        `;

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    };
}
