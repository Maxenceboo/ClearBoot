# API Reference

Complete API reference for ClearBoot decorators, interfaces, and utilities.

---

## Table of Contents

1. [Decorators](#decorators)
2. [Interfaces](#interfaces)
3. [Core Classes](#core-classes)
4. [Utilities](#utilities)

---

## Decorators

### Controller Decorators

#### @Controller(path?: string)

Defines a controller class with an optional base path for all routes.

```typescript
@Controller("/users")
class UserController {}

@Controller() // No prefix
class RootController {}
```

| Parameter | Type   | Required | Default | Description                            |
| --------- | ------ | -------- | ------- | -------------------------------------- |
| `path`    | string | No       | ''      | Base path for all routes in controller |

---

### Route Decorators

#### @Get(path?: string)

Handles HTTP GET requests.

```typescript
@Get('/')           // GET /users
@Get('/:id')        // GET /users/:id
@Get('/all')        // GET /users/all
```

#### @Post(path?: string)

Handles HTTP POST requests.

```typescript
@Post('/')          // POST /users
@Post('/bulk')      // POST /users/bulk
```

#### @Put(path?: string)

Handles HTTP PUT requests (replace entire resource).

```typescript
@Put('/:id')        // PUT /users/:id
```

#### @Patch(path?: string)

Handles HTTP PATCH requests (partial update).

```typescript
@Patch('/:id')      // PATCH /users/:id
```

#### @Delete(path?: string)

Handles HTTP DELETE requests.

```typescript
@Delete('/:id')     // DELETE /users/:id
```

#### @Head(path?: string)

Handles HTTP HEAD requests.

```typescript
@Head('/:id')       // HEAD /users/:id
```

#### @Options(path?: string)

Handles HTTP OPTIONS requests.

```typescript
@Options('/')       // OPTIONS /users
```

---

### Parameter Decorators

#### @Param(name: string)

Extract route parameters from the URL path. Supports regex validation patterns.

```typescript
// Basic parameters
@Get('/:id')
getUser(@Param('id') id: string) { }

@Get('/:userId/posts/:postId')
getUserPost(
    @Param('userId') userId: string,
    @Param('postId') postId: string
) { }

// With regex validation
@Get('/users/:id(\\d+)')           // Only numbers
@Get('/posts/:slug([a-z-]+)')      // Lowercase + hyphens
@Get('/files/:name(.+\\.\\w+)')    // Filename with extension
getResource(@Param('id') id: string) { }
```

**Note**: If the URL doesn't match the regex pattern, it returns 404 automatically.

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| `name`    | string | Yes      | Parameter name in route path |

---

#### @Query()

Extract query string parameters.

```typescript
@Get('/search')
search(@Query() params: any) {
    const { q, limit, offset } = params;
}

// GET /search?q=javascript&limit=10
// params = { q: 'javascript', limit: '10' }
```

Returns all query parameters as an object. Values are strings.

---

#### @Body()

Extract request body as JSON.

```typescript
@Post('/')
create(@Body() body: any) {
    const { name, email } = body;
}

// POST /users with body: { "name": "John", "email": "john@example.com" }
```

Body must be valid JSON. Automatically parsed by ClearBoot.

---

#### @Req()

Access raw Node.js request object.

```typescript
@Get('/headers')
getHeaders(@Req() req: any) {
    const userAgent = req.headers['user-agent'];
    const method = req.method;
    const url = req.url;
}
```

Provides full access to Node.js IncomingMessage object.

---

#### @Res()

Access raw Node.js response object.

```typescript
@Get('/custom')
custom(@Res() res: any) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Custom response');
}
```

Provides full access to Node.js ServerResponse object.

---

#### @Cookie(name?: string)

Extract cookies from the request. Can extract a specific cookie or all cookies.

```typescript
// Extract a specific cookie
@Get('/session')
checkSession(@Cookie('sessionId') sessionId: string) {
    if (!sessionId) {
        return { authenticated: false };
    }
    return { authenticated: true };
}

// Extract all cookies
@Get('/all-cookies')
getAllCookies(@Cookie() cookies: Record<string, string>) {
    return { cookies };
}
```

| Parameter | Type   | Required | Description                        |
| --------- | ------ | -------- | ---------------------------------- |
| `name`    | string | No       | Cookie name (omit for all cookies) |

**Note**: Cookies are automatically URL-decoded.

---

### Feature Decorators

#### @Validate(schema: ZodSchema)

Validate incoming request body against a Zod schema.

```typescript
import { z } from 'zod';

const UserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email()
});

@Post('/')
@Validate(UserSchema)
create(@Body() body: any) {
    // body is guaranteed to match schema
}
```

| Parameter | Type      | Required | Description               |
| --------- | --------- | -------- | ------------------------- |
| `schema`  | ZodSchema | Yes      | Zod schema for validation |

**Error Response**: Returns 400 with validation details if invalid.

---

#### @Serialize(dtoClass: class)

Transform response object using a DTO class.

```typescript
class UserDTO {
    @Expose() id: number;
    @Expose() name: string;
    @Exclude() passwordHash: string;
}

@Get('/:id')
@Serialize(UserDTO)
getUser() { }
```

| Parameter  | Type  | Required | Description                  |
| ---------- | ----- | -------- | ---------------------------- |
| `dtoClass` | class | Yes      | DTO class for transformation |

---

#### @HttpCode(code: number)

Set HTTP status code for the response.

```typescript
@Post('/')
@HttpCode(201)
create() { }

@Delete('/:id')
@HttpCode(204)
delete() { }
```

| Parameter | Type   | Required | Default | Description      |
| --------- | ------ | -------- | ------- | ---------------- |
| `code`    | number | Yes      | 200     | HTTP status code |

---

#### @Header(HeaderProviderClass: class)

Add custom headers to the response.

```typescript
@Injectable()
class ApiHeaderProvider implements IHeaderProvider {
    getHeaders(): Record<string, string> {
        return { 'X-API-Version': '1.0' };
    }
}

@Get('/data')
@Header(ApiHeaderProvider)
getData() { }
```

| Parameter             | Type  | Required | Description                                   |
| --------------------- | ----- | -------- | --------------------------------------------- |
| `HeaderProviderClass` | class | Yes      | Injectable class implementing IHeaderProvider |

---

### Middleware Decorator

#### @Middleware(middlewareClass: class)

Apply middleware to controller or route.

```typescript
@Injectable()
class AuthMiddleware implements IMiddleware {
  async use(req: any, res: any, next: () => Promise<void>) {
    // Middleware logic
    await next();
  }
}

@Controller("/api")
@Middleware(AuthMiddleware) // Apply to all routes
class ApiController {
  @Get("/public")
  public() {}

  @Get("/private")
  @Middleware(AuthMiddleware) // Apply only to this route
  private() {}
}
```

| Parameter         | Type  | Required | Description                               |
| ----------------- | ----- | -------- | ----------------------------------------- |
| `middlewareClass` | class | Yes      | Injectable class implementing IMiddleware |

---

### Dependency Injection Decorator

#### @Injectable()

Mark a class as injectable in the DI container.

```typescript
@Injectable()
class UserService {
  getUser(id: number) {}
}

@Controller("/users")
class UserController {
  private userService = inject(UserService);
}
```

Auto-registers the class in the global container.

---

## Interfaces

### IMiddleware

Interface for middleware classes.

```typescript
interface IMiddleware {
  use(req: any, res: any, next: () => Promise<void>): Promise<void>;
}
```

**Parameters**:

- `req` - Node.js IncomingMessage object
- `res` - Node.js ServerResponse object
- `next` - Function to call next middleware/handler

**Example**:

```typescript
@Injectable()
class LoggerMiddleware implements IMiddleware {
  async use(req: any, res: any, next: () => Promise<void>) {
    console.log(`${req.method} ${req.url}`);
    await next();
    console.log(`Response: ${res.statusCode}`);
  }
}
```

---

### IHeaderProvider

Interface for header provider classes.

```typescript
interface IHeaderProvider {
  getHeaders(): Record<string, string>;
}
```

**Returns**: Object with header key-value pairs.

**Example**:

```typescript
@Injectable()
class ApiHeaderProvider implements IHeaderProvider {
  getHeaders(): Record<string, string> {
    return {
      "X-API-Version": "1.0",
      "X-Powered-By": "ClearBoot",
    };
  }
}
```

---

## Core Classes

### ClearBoot

Main initialization function for setting up and running the server.

#### Function Signature

```typescript
ClearBoot.create(config?: ApplicationConfig): Application
```

#### Configuration

```typescript
interface ApplicationConfig {
  globalMiddlewares?: (Function | { handle: Function })[];
  cors?: CorsOptions;
  port?: number;
  bodyLimit?: string;
}
```

Initialize with configuration:

```typescript
const app = ClearBoot.create({
  globalMiddlewares: [LoggerMiddleware, AuthMiddleware],
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});
```

**globalMiddlewares**: Array of middleware classes applied in order to all requests.

**cors**: CORS configuration options. Pass an object to enable, or omit to disable.

**port**: Server port (defaults to 3000).

**bodyLimit**: Maximum request body size (defaults to '1mb').

---

##### `getServer()`

Get the underlying Node.js HTTP server.

```typescript
const server = app.getServer();
// Used in testing with supertest
```

---

## Utilities

### inject()

Resolve a service from the DI container.

```typescript
import { inject } from "clearboot";

const userService = inject(UserService);
const user = userService.getUser(1);
```

**Syntax**:

```typescript
inject<T>(ServiceClass: constructor<T>): T
```

| Parameter      | Type        | Required | Description              |
| -------------- | ----------- | -------- | ------------------------ |
| `ServiceClass` | constructor | Yes      | Service class to resolve |

**Returns**: Instance of the service.

---

### globalContainer

The global DI container instance.

```typescript
import { globalContainer } from "clearboot";

// Register service manually
globalContainer.register(MyService, () => new MyService());

// Access container
const service = globalContainer.get(MyService);
```

**Methods**:

- `register<T>(ServiceClass, factory)` - Register a service
- `get<T>(ServiceClass)` - Get a service instance
- `has<T>(ServiceClass)` - Check if service exists

---

## Type Definitions

### ClearResponse

Extended HTTP response object with additional methods.

```typescript
interface ClearResponse extends http.ServerResponse {
  status(code: number): this;
  json(data: any): void;
  send(data: string): void;
  cookie(name: string, value: string, options?: CookieOptions): this;
  clearCookie(name: string, options?: CookieOptions): this;
}
```

**Methods**:

- `status(code)` - Set HTTP status code (chainable)
- `json(data)` - Send JSON response
- `send(data)` - Send plain text response
- `cookie(name, value, options)` - Set a cookie (chainable)
- `clearCookie(name, options)` - Clear a cookie (chainable)

**Usage**:

```typescript
@Get('/test')
test(@Res() res: ClearResponse) {
    res.status(200)
       .cookie('session', 'abc123', { httpOnly: true })
       .json({ success: true });
}
```

---

### CookieOptions

Options for setting cookies.

```typescript
interface CookieOptions {
  maxAge?: number; // Duration in milliseconds
  expires?: Date; // Expiration date
  httpOnly?: boolean; // HTTP-only (not accessible via JS)
  secure?: boolean; // HTTPS only
  sameSite?: "Strict" | "Lax" | "None"; // CSRF protection
  path?: string; // Cookie path (default: '/')
  domain?: string; // Cookie domain
}
```

**Example**:

```typescript
res.cookie("token", "xyz", {
  httpOnly: true,
  secure: true,
  maxAge: 3600000, // 1 hour
  sameSite: "Strict",
});
```

---

### HeaderProviderClass

Type alias for header provider class constructors.

```typescript
type HeaderProviderClass = constructor<IHeaderProvider>;
```

Used in @Header decorator parameter.

---

## Complete Examples

### Example 1: Basic CRUD

```typescript
@Injectable()
class UserService {
  getAll() {
    return [];
  }
  getById(id: number) {
    return {};
  }
  create(data: any) {
    return {};
  }
  update(id: number, data: any) {
    return {};
  }
  delete(id: number) {}
}

@Controller("/users")
class UserController {
  private service = inject(UserService);

  @Get("/")
  getAll() {
    return this.service.getAll();
  }

  @Get("/:id")
  getById(@Param("id") id: string) {
    return this.service.getById(parseInt(id));
  }

  @Post("/")
  @HttpCode(201)
  @Validate(CreateUserSchema)
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put("/:id")
  @Validate(UpdateUserSchema)
  update(@Param("id") id: string, @Body() body: any) {
    return this.service.update(parseInt(id), body);
  }

  @Delete("/:id")
  delete(@Param("id") id: string) {
    this.service.delete(parseInt(id));
    return { success: true };
  }
}
```

---

### Example 2: With Middleware

```typescript
@Injectable()
class AuthMiddleware implements IMiddleware {
  async use(req: any, res: any, next: () => Promise<void>) {
    const token = req.headers.authorization;
    if (!token) {
      res.writeHead(401).end("Unauthorized");
      return;
    }
    req.user = { id: 1 }; // Simulated
    await next();
  }
}

@Controller("/api")
@Middleware(AuthMiddleware)
class ApiController {
  @Get("/data")
  getData() {
    return { status: "ok" };
  }
}
```

---

### Example 3: With Validation & Serialization

```typescript
const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

class UserDTO {
  @Expose() id: number;
  @Expose() name: string;
  @Expose() email: string;
  @Exclude() passwordHash: string;
}

@Controller("/users")
class UserController {
  @Post("/")
  @HttpCode(201)
  @Validate(CreateUserSchema)
  @Serialize(UserDTO)
  create(@Body() body: any) {
    return {
      id: 1,
      ...body,
      passwordHash: "secret",
    };
  }
}
```

---

### Example 4: With Custom Headers

```typescript
@Injectable()
class ApiHeaderProvider implements IHeaderProvider {
  private config = inject(ConfigService);

  getHeaders(): Record<string, string> {
    return {
      "X-API-Version": this.config.apiVersion,
      "X-Request-ID": this.generateRequestId(),
      "X-Powered-By": "ClearBoot",
    };
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

@Controller("/api")
class ApiController {
  @Get("/data")
  @Header(ApiHeaderProvider)
  getData() {
    return { status: "ok" };
  }
}
```

---

## Quick Reference

### Decorators by Category

**Route Definition**:

- @Get, @Post, @Put, @Patch, @Delete, @Head, @Options

**Parameter Extraction**:

- @Param, @Query, @Body, @Cookie, @Req, @Res

**Feature Control**:

- @Validate, @Serialize, @HttpCode, @Header

**Architecture**:

- @Controller, @Middleware, @Injectable

### Common Patterns

**Validation + Serialization**:

```typescript
@Post('/')
@Validate(MySchema)
@Serialize(MyDTO)
handler(@Body() body: any) { }
```

**With Status Code**:

```typescript
@Post('/')
@HttpCode(201)
handler() { }
```

**With Middleware**:

```typescript
@Controller("/api")
@Middleware(AuthMiddleware)
class Controller {}
```

**With Headers**:

```typescript
@Get('/data')
@Header(HeaderProvider)
handler() { }
```

---

## Error Handling

### Validation Errors

```
Status: 400
Body: {
    "error": "Validation Failed",
    "status": 400,
    "details": {
        "field": {
            "_errors": ["Error message"]
        }
    }
}
```

### Not Found Errors

```
Status: 404
Body: {
    "error": "Resource not found",
    "status": 404
}
```

### Unauthorized Errors

```
Status: 401
Body: {
    "error": "Unauthorized",
    "status": 401
}
```

### Server Errors

```
Status: 500
Body: {
    "error": "Internal Server Error",
    "status": 500
}
```

---

## Best Practices

### ✅ DO:

- ✅ Use @Validate for all inputs
- ✅ Use @Serialize to control output
- ✅ Use @HttpCode for correct status codes
- ✅ Use dependency injection for services
- ✅ Apply middleware at controller level when shared

### ❌ DON'T:

- ❌ Mix validation logic with handler
- ❌ Return internal models without serialization
- ❌ Hardcode status codes
- ❌ Create service instances directly
- ❌ Ignore error handling

---

## TypeScript Support

All decorators and utilities are fully typed for TypeScript projects.

```typescript
// Type-safe parameter extraction
@Get('/:id')
getUser(@Param('id') id: string): User { }

// Type-safe body validation
@Post('/')
@Validate(UserSchema)
create(@Body() body: CreateUserInput): UserResponse { }

// Type-safe service injection
@Injectable()
class UserService {
    getUser(id: number): Promise<User | null> { }
}

@Controller('/users')
class UserController {
    private userService = inject(UserService);
}
```

---

## References

- [Getting Started](getting-started.md)
- [Controllers Guide](controllers-guide.md)
- [Feature Decorators](feature-decorators.md)
- [Testing Guide](testing.md)
- [Patterns](patterns.md)
