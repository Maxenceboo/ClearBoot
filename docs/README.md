# ClearBoot Documentation

Complete documentation for ClearBoot - a lightweight, type-safe TypeScript framework for building REST APIs.

---

## 📖 Quick Navigation

### Getting Started
- **[Getting Started](getting-started.md)** - Installation, setup, and your first server
- **[Controllers Guide](controllers-guide.md)** - Routes, HTTP verbs, and parameters

### Core Features
- **[HTTP Features](http-features.md)** - Cookies, file uploads, and form-data
- **[HTTP Responses](http-response.md)** - Status codes, headers, and serialization
- **[Validation](validation.md)** - Schema validation with Zod
- **[Middleware](middlewares.md)** - Request/response processing pipeline
- **[Logging](logging.md)** - Structured logging with configurable levels
- **[Swagger/OpenAPI](swagger.md)** - Auto-generated API documentation
- **[Dependency Injection](dependency-injection.md)** - Basic DI concepts
- **[DI Advanced](dependency-injection-advanced.md)** - Advanced patterns and testing

### Advanced Topics
- **[Feature Decorators](feature-decorators.md)** - `@Validate`, `@Serialize`, `@HttpCode`, `@Header`
- **[Architecture Patterns](patterns.md)** - MVC, Service Layer, Repository Pattern
- **[Lifecycle Hooks](lifecycle.md)** - `onModuleInit`, graceful shutdown, ORM integration
- **[Testing](testing.md)** - Unit tests, integration tests, mocking strategies
- **[Configuration](configuration.md)** - Environment variables and app configuration
- **[Exception Handling](exceptions.md)** - Custom errors and error middleware
- **[API Reference](api-reference.md)** - Complete decorator and API reference
- **[Framework Architecture](architecture.md)** - Internal architecture overview

---

## 🏗️ Documentation Structure

```
docs/
├── getting-started.md                    # 👈 Start here
├── controllers-guide.md                  # Route handlers and HTTP verbs
├── http-response.md                      # Response handling
├── http-features.md                      # Cookies, uploads, form-data
├── validation.md                         # Input validation
├── middlewares.md                        # Request/response pipeline
├── logging.md                            # Logging system
├── dependency-injection.md               # Basic DI
├── dependency-injection-advanced.md      # Advanced DI patterns
├── feature-decorators.md                 # @Validate, @Serialize
├── patterns.md                           # Architectural patterns
├── lifecycle.md                          # Lifecycle hooks
├── testing.md                            # Testing strategies
├── configuration.md                      # Environment config
├── exceptions.md                         # Error handling
├── api-reference.md                      # Complete API docs
└── architecture.md                       # Framework internals
```

---

---

## Learning Path

### Beginner
1. [Getting Started](getting-started.md) - Learn basic concepts
2. [Controllers Guide](controllers-guide.md) - Build your first routes
3. [HTTP Responses](http-response.md) - Control responses

### Intermediate
4. [Validation](validation.md) - Validate user input
5. [Middleware](middlewares.md) - Add cross-cutting concerns
6. [Dependency Injection](dependency-injection.md) - Organize services

### Advanced
7. [Architectural Patterns](patterns.md) - Design scalable apps
8. [Testing Guide](testing.md) - Write comprehensive tests
9. [Dependency Injection Advanced](dependency-injection-advanced.md) - Master DI
10. [Feature Decorators](feature-decorators.md) - Advanced decorator usage

---

## Core Concepts

### Controllers
Route handlers that process HTTP requests and return responses.

```typescript
@Controller('/users')
class UserController {
    @Get('/:id')
    getUser(@Param('id') id: string) {
        return { id };
    }
}
```

### Decorators
Metadata-driven annotations for routes, parameters, and features.

```typescript
@Controller('/api')
@Middleware(AuthMiddleware)
class ApiController {
    @Post('/data')
    @Validate(DataSchema)
    @Serialize(DataDTO)
    @HttpCode(201)
    createData(@Body() body: any) {
        return body;
    }
}
```

### Dependency Injection
Share singleton instances across your application.

```typescript
@Injectable()
class UserService {
    getUser(id: number) { }
}

@Controller('/users')
class UserController {
    private userService = inject(UserService);
}
```

### Validation
Validate incoming data with schemas.

```typescript
const UserSchema = z.object({
    name: z.string(),
    email: z.string().email()
});

@Post('/')
@Validate(UserSchema)
create(@Body() body: any) { }
```

### Middleware
Process requests and responses, add cross-cutting concerns.

```typescript
@Injectable()
class LoggerMiddleware implements IMiddleware {
    async use(req, res, next) {
        console.log(`${req.method} ${req.url}`);
        await next();
    }
}

@Controller('/api')
@Middleware(LoggerMiddleware)
class ApiController { }
```

### Serialization
Transform responses using DTOs.

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

---

## API Overview

### Decorators
- `@Controller(path)` - Define a controller with base path
- `@Get(path)` - GET route handler
- `@Post(path)` - POST route handler
- `@Put(path)` - PUT route handler
- `@Delete(path)` - DELETE route handler
- `@Patch(path)` - PATCH route handler
- `@Middleware(middlewareClass)` - Apply middleware
- `@Validate(schema)` - Validate input
- `@Serialize(dtoClass)` - Transform response
- `@HttpCode(code)` - Set HTTP status
- `@Header(headerProvider)` - Add custom headers
- `@Injectable()` - Mark class as injectable
- `@Param(name)` - Get route parameter
- `@Query()` - Get query parameters
- `@Body()` - Get request body
- `@Req()` - Get raw request
- `@Res()` - Get raw response

### Interfaces
- `IMiddleware` - Middleware interface
- `IHeaderProvider` - Header provider interface
- `IRepository<T>` - Repository pattern interface

### Services
- `Application` - Main application class
- `inject<T>(ServiceClass)` - Resolve service from DI container
- `globalContainer` - Access DI container

---

## Example Project

### Directory Structure
```
src/
├── main.ts
├── controllers/
│   ├── user.controller.ts
│   └── product.controller.ts
├── services/
│   ├── user.service.ts
│   └── product.service.ts
├── repositories/
│   ├── user.repository.ts
│   └── product.repository.ts
├── middlewares/
│   ├── auth.middleware.ts
│   └── logger.middleware.ts
├── dtos/
│   ├── user.dto.ts
│   └── product.dto.ts
└── exceptions/
    └── app.exceptions.ts

test/
├── unit/
├── integration/
└── fixtures/
```

### Minimal Setup
```typescript
// main.ts
import { ClearBoot } from 'clearboot';
import { UserController } from './controllers/user.controller';

ClearBoot.create();
```

---

## Common Patterns

### Service Layer Architecture
Separate business logic into services, repositories, and controllers.

```typescript
// Repository
@Injectable()
class UserRepository {
    async findById(id: number) { }
}

// Service
@Injectable()
class UserService {
    private repo = inject(UserRepository);
    async getUser(id: number) { }
}

// Controller
@Controller('/users')
class UserController {
    private userService = inject(UserService);
    
    @Get('/:id')
    async getUser(@Param('id') id: string) {
        return this.service.getUser(parseInt(id));
    }
}
```

### Error Handling
```typescript
@Injectable()
class ErrorHandlerMiddleware implements IMiddleware {
    async use(req, res, next) {
        try {
            await next();
        } catch (error) {
            res.writeHead(error.statusCode || 500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }
}
```

### Request Validation + Response Serialization
```typescript
@Post('/users')
@Validate(CreateUserSchema)
@Serialize(UserDTO)
@HttpCode(201)
create(@Body() body: any) {
    return userService.create(body);
}
```

---

## Testing

### Unit Tests
```typescript
describe('UserService', () => {
    test('should find user', async () => {
        const mockRepo = { findById: jest.fn().mockResolvedValue({ id: 1 }) };
        const service = new UserService(mockRepo as any);
        const user = await service.getUser(1);
        expect(user.id).toBe(1);
    });
});
```

### Integration Tests
```typescript
describe('User API', () => {
    test('should create user', async () => {
        const res = await request(server)
            .post('/users')
            .send({ name: 'John', email: 'john@example.com' })
            .expect(201);
        expect(res.body.id).toBeDefined();
    });
});
```

---

## Troubleshooting

### Routes not working
- Verify ClearBoot.create() is called
- Check route path and HTTP verb match your request
- Use browser devtools to inspect actual requests

### Validation not working
- Ensure `@Validate` decorator is present
- Check Zod schema is correct
- Verify request body matches schema structure

### Dependency Injection not working
- Verify service has `@Injectable()` decorator
- Check service is properly injected in constructor
- Use `inject<ServiceClass>(ServiceClass)` to resolve manually

### Tests failing
- Check mocks are set up before test execution
- Verify test data matches expected types
- Use `.toHaveBeenCalledWith()` to debug calls

---

## Resources

### External Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev)
- [Jest Documentation](https://jestjs.io)
- [class-transformer](https://github.com/typestack/class-transformer)

### Related Patterns
- [MVC Pattern](patterns.md#mvc-pattern)
- [Service Layer Pattern](patterns.md#service-layer-pattern)
- [Repository Pattern](patterns.md#repository-pattern)
- [Middleware Chain Pattern](patterns.md#middleware-chain-pattern)

---

## Contributing

To improve this documentation:
1. Identify unclear sections
2. Add examples for complex concepts
3. Expand troubleshooting guides
4. Create additional pattern examples

---

## Version Info

- **Framework Version**: 1.0.0
- **Latest Update**: 2024
- **Status**: Production Ready

---

## Quick Links

- 📚 [Full Documentation Index](#core-concepts)
- 🚀 [Quick Start Guide](getting-started.md)
- 🧪 [Testing Examples](testing.md)
- 🏗️ [Architecture Patterns](patterns.md)
- ❓ [Troubleshooting](#troubleshooting)

---

## Next Steps

1. **[Get Started](getting-started.md)** - Create your first endpoint
2. **[Learn Controllers](controllers-guide.md)** - Master routing
3. **[Build Services](patterns.md#service-layer-pattern)** - Organize logic
4. **[Add Tests](testing.md)** - Ensure quality
5. **[Deploy](configuration.md)** - Ship to production

Happy coding! 🎉
