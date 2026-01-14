import * as http from 'http';
import { SwaggerGenerator, SwaggerConfig, OpenAPISpec, createSwaggerUI } from '../http/swagger-generator';

/**
 * Swagger integration helper for ClearBoot applications
 * 
 * Usage:
 * ```typescript
 * const app = ClearBoot.create();
 * SwaggerManager.setup(app, {
 *     title: 'My API',
 *     version: '1.0.0',
 *     description: 'API documentation'
 * }, [UserController, ProductController]);
 * ```
 */
export class SwaggerManager {
    private static spec: OpenAPISpec | null = null;

    /**
     * Setup Swagger documentation for your application
     * @param server HTTP server instance
     * @param config Swagger configuration
     * @param controllers Array of controller classes
     * @param docPath URL path where docs will be served (default: /api/docs)
     */
    static setup(
        server: any,
        config: SwaggerConfig,
        controllers: any[],
        docPath: string = '/api/docs'
    ) {
        // Generate OpenAPI spec from controllers
        this.spec = SwaggerGenerator.generateSpec(config, controllers);

        // Serve Swagger UI at specified path
        const originalRequestHandler = server.requestListener || server.listeners('request')[0];

        const wrappedHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
            if (req.url === docPath || req.url === docPath + '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.renderSwaggerUI());
                return;
            }

            if (req.url === `${docPath}/spec.json` || req.url === `${docPath}/openapi.json`) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.spec, null, 2));
                return;
            }

            originalRequestHandler(req, res);
        };

        // Replace request listener
        server.listeners('request').forEach((listener: any) => {
            server.removeListener('request', listener);
        });
        server.on('request', wrappedHandler);

        console.log(`📚 Swagger UI available at ${config.servers?.[0]?.url || 'http://localhost:3000'}${docPath}`);
    }

    /**
     * Get the generated OpenAPI specification
     */
    static getSpec(): OpenAPISpec | null {
        return this.spec;
    }

    /**
     * Get the specification as JSON
     */
    static getSpecJSON(): string {
        return JSON.stringify(this.spec, null, 2);
    }

    /**
     * Render Swagger UI HTML
     */
    private static renderSwaggerUI(): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.spec?.info.title || 'API Documentation'}</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@3/swagger-ui.css">
    <style>
        body { margin: 0; padding: 0; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
    <script>
        SwaggerUIBundle({
            url: window.location.pathname + '/spec.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
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
    }
}
