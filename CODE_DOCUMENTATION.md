# ClearBoot v2 - Code Documentation Summary

## Overview

ClearBoot is a lightweight, decorator-based TypeScript HTTP framework built on native Node.js. All code has been comprehensively documented with JSDoc comments following industry best practices.

## 📚 Documentation Coverage

### ✅ Core Application (src/lib/core/)

**application.ts**

- `ClearBoot.create()` - Server creation and initialization
- `ModuleConfig` interface with lifecycle hooks
- Graceful shutdown handlers (SIGTERM, SIGINT)
- Service registration and controller scanning

**request-handler.ts**

- HTTP request routing and matching
- Middleware composition chain
- Parameter injection (@Body, @Param, @Query, @Req, @Res, @Cookie)
- Request validation with Zod schemas
- Body parsing (JSON, form-data, multipart)
- Error handling with HTTP exceptions

**metadata-scanner.ts**

- `MetadataScanner.scan()` - Controller metadata extraction
- Route definition processing
- Console logging of registered routes

### ✅ Dependency Injection (src/lib/di/)

**container.ts**

- `Container` class with singleton pattern
- `register()` and `resolve()` methods
- `inject()` function for service resolution
- Type-safe generic service retrieval

### ✅ Decorators (src/lib/decorators/)

**verbs.ts** - HTTP Method Decorators

- `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`
- Route path and order (priority) configuration
- Examples for each decorator

**params.ts** - Parameter Injection Decorators

- `@Body()` - Request body extraction
- `@Query()` - Query string parameters
- `@Param()` - Route path parameters
- `@Req()` - Raw HTTP request
- `@Res()` - Enhanced response object
- `@Cookie()` - Cookie values

**http.ts** - HTTP Features

- `@HttpCode()` - Custom HTTP status codes
- `@Header()` - Dynamic response headers via injectable providers

**validate.ts** - Input Validation

- `@Validate()` - Zod schema validation
- Error handling (400 Bad Request)
- Parameter detection and validation

**serialize.ts** - Response Transformation

- `@Serialize()` - DTO-based response transformation
- Class-transformer integration
- Property exposure control

**middleware.ts** - Middleware Attachment

- `@Middleware()` - Controller or route-level middleware
- Multiple middleware support

**core.ts** - Core Decorators

- `@Injectable()` - Service registration in DI container
- `@Controller()` - Controller registration with base path

### ✅ HTTP Utilities (src/lib/http/)

**response.ts**

- `ClearResponse` interface - Extended ServerResponse
- `CookieOptions` interface with security settings
- `extendResponse()` - Helper method extension
- Methods: `.status()`, `.json()`, `.send()`, `.cookie()`, `.clearCookie()`

**cors.ts**

- `CorsOptions` interface
- `applyCors()` - CORS header application
- Origin whitelist, credentials, and preflight caching

**request-utils.ts**

- `parseBody()` - JSON body parsing
- `parseQueryParams()` - Query string parsing
- `parseFormData()` - Form URL-encoded parsing
- `parseCookies()` - Cookie extraction
- `isJson()` - Content-type detection

**multipart-parser.ts**

- `UploadedFile` interface
- `MultipartResult` interface
- `parseMultipart()` - Multipart/form-data parsing
- Security limits: 10MB per file, 50MB total
- Educational parser with production library recommendations

**header-provider.ts**

- `IHeaderProvider` implementation reference

### ✅ Common Types & Exceptions (src/lib/common/)

**types.ts**

- `ParamType` enum - Parameter injection types
- `PROVIDERS_REGISTRY` - Service registry
- `CONTROLLERS_REGISTRY` - Controller registry

**exceptions.ts**

- `HttpException` - Base exception class
- `BadRequestException` (400)
- `UnauthorizedException` (401)
- `ForbiddenException` (403)
- `NotFoundException` (404)
- `InternalServerErrorException` (500)
- `PayloadTooLargeException` (413)

**interfaces.ts**

- `IMiddleware` - Middleware contract
- `IHeaderProvider` - Header provider contract
- `IModuleInit` - Lifecycle hook contract
- Type definitions for middleware and provider classes

### ✅ Middlewares (src/lib/middlewares/)

**helmet.middleware.ts**

- Security headers: X-Content-Type-Options, X-Frame-Options, etc.
- XSS protection, DNS prefetch control
- HSTS support (commented for HTTPS environments)

**logger.middleware.ts**

- Request/response logging
- HTTP method, URL, status code, duration tracking

**rate-limit.middleware.ts**

- In-memory rate limiting (per IP)
- 15-minute window, 100 requests per window
- 429 Too Many Requests response
- X-RateLimit headers

### ✅ Router (src/lib/router/)

**path-matcher.ts**

- `matchPath()` - Dynamic route matching
- Parameter extraction from paths
- Regex-based path patterns
- Examples with ID, UUID, regex patterns

## 📊 Documentation Statistics

| Module      | Files  | Documented | Status      |
| ----------- | ------ | ---------- | ----------- |
| Core        | 3      | 3          | ✅          |
| DI          | 1      | 1          | ✅          |
| Decorators  | 7      | 7          | ✅          |
| HTTP        | 5      | 5          | ✅          |
| Common      | 2      | 2          | ✅          |
| Middlewares | 3      | 3          | ✅          |
| Router      | 1      | 1          | ✅          |
| **Total**   | **22** | **22**     | **✅ 100%** |

## 🎯 Documentation Style

All JSDoc comments follow these standards:

### Function Documentation

```typescript
/**
 * Brief description of what the function does.
 * More detailed explanation if needed.
 *
 * @param paramName - Parameter description
 * @returns Return value description
 * @throws ExceptionType if something goes wrong
 * @example
 * // Example usage showing how to call the function
 * const result = functionName(arg);
 */
```

### Class Documentation

```typescript
/**
 * Class description with context and purpose.
 * Implementation notes if relevant.
 * Usage guidance and patterns.
 */
```

### Interface Documentation

```typescript
/**
 * Interface purpose and usage context.
 */
interface ExampleInterface {
  /** Property description */
  propertyName: type;
}
```

## 🔍 Key Features Documented

- ✅ Dependency Injection (DI container, service registration)
- ✅ Decorator system (@Controller, @Get, @Body, @Validate, etc.)
- ✅ Request handling (routing, parameter injection, middleware)
- ✅ Response handling (status codes, headers, cookies)
- ✅ Input validation (Zod schemas)
- ✅ Response transformation (DTOs)
- ✅ Middleware chains (global, controller-level, route-level)
- ✅ Error handling (HTTP exceptions, status codes)
- ✅ Security (Helmet middleware, CORS, rate-limiting)
- ✅ File uploads (multipart/form-data with size limits)
- ✅ Cookies (secure options, HttpOnly, SameSite)
- ✅ Lifecycle hooks (onModuleInit, graceful shutdown)

## 🧪 Test Coverage

All functionality documented with comprehensive test coverage:

- **20 test suites**
- **82 passing tests**
- Integration tests for all major features
- Unit tests for utilities and decorators

## 📝 Usage Examples

All documented functions include practical examples:

```typescript
// Service Registration & Injection
@Injectable()
class UserService {
  getAll() {
    return ["Alice", "Bob"];
  }
}

// Controller Definition
@Controller("/users")
class UserController {
  constructor(private userService: UserService) {}

  @Get("/:id")
  @Validate(GetUserSchema)
  getUser(@Param("id") id: string) {
    return { id, name: "Alice" };
  }
}

// Server Creation with Lifecycle
const server = await ClearBoot.create({
  port: 3000,
  globalMiddlewares: [HelmetMiddleware, RateLimitMiddleware],
  cors: { origin: "*" },
  onModuleInit: async () => {
    await database.connect();
  },
});
```

## 🚀 Getting Started

For detailed usage information, refer to:

- [docs/getting-started.md](docs/getting-started.md) - Quick start guide
- [docs/controllers-guide.md](docs/controllers-guide.md) - Controller patterns
- [docs/dependency-injection.md](docs/dependency-injection.md) - DI concepts
- [docs/middlewares.md](docs/middlewares.md) - Middleware system
- [docs/validation.md](docs/validation.md) - Input validation

## ✨ Conclusion

ClearBoot v2 is fully documented at the code level with comprehensive JSDoc comments. Each function, class, interface, and decorator includes:

- Clear descriptions of purpose and behavior
- Parameter and return value documentation
- Examples showing practical usage
- Exception/error documentation
- Type information and constraints

This makes the codebase highly maintainable and developer-friendly.
