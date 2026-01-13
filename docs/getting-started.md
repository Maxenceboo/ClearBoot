# Getting Started with ClearBoot

A lightweight, type-safe TypeScript framework for building REST APIs with zero external dependencies for HTTP handling.

---

## Quick Start

### Installation

```bash
npm install clearboot
```

### Your First Server

```typescript
// src/main.ts
import { Application, Controller, Get } from 'clearboot';

@Controller()
class HelloController {
    @Get('/hello')
    hello() {
        return { message: 'Hello, World!' };
    }
}

const app = new Application();
app.scan(HelloController);
app.listen(3000);

console.log('Server running at http://localhost:3000');
```

### Running

```bash
npx ts-node src/main.ts
```

Visit `http://localhost:3000/hello` and get:
```json
{
    "message": "Hello, World!"
}
```

---

## Core Concepts

### 1. Controllers

Controllers handle HTTP requests and return responses.

```typescript
import { Controller, Get, Post, Put, Delete } from 'clearboot';

@Controller('/users')
class UserController {
    @Get('/')
    listUsers() {
        return { users: [] };
    }

    @Get('/:id')
    getUser(id: string) {
        return { id };
    }

    @Post('/')
    createUser() {
        return { id: 1 };
    }

    @Put('/:id')
    updateUser(id: string) {
        return { id };
    }

    @Delete('/:id')
    deleteUser(id: string) {
        return { success: true };
    }
}

const app = new Application();
app.scan(UserController);
app.listen(3000);
```

### 2. Request Parameters

Access request data with parameter decorators:

```typescript
import { Controller, Get, Post, Body, Param, Query, Req, Res } from 'clearboot';

@Controller('/api')
class ApiController {
    // Route parameters: /api/users/123
    @Get('/users/:id')
    getUser(@Param('id') id: string) {
        return { id };
    }

    // Query parameters: /api/search?q=javascript&limit=10
    @Get('/search')
    search(@Query() query: any) {
        return { query: query.q, limit: query.limit };
    }

    // Request body: POST with JSON
    @Post('/users')
    createUser(@Body() body: any) {
        return { ...body, id: 1 };
    }

    // Raw request/response
    @Get('/raw')
    raw(@Req() req: any, @Res() res: any) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Plain text response');
    }
}
```

### 3. Validation

Validate incoming data with Zod:

```typescript
import { Controller, Post, Body, Validate } from 'clearboot';
import { z } from 'zod';

const UserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    age: z.number().min(18)
});

@Controller('/users')
class UserController {
    @Post('/')
    @Validate(UserSchema)
    createUser(@Body() user: any) {
        // User is guaranteed to match schema
        return { ...user, id: 1 };
    }
}
```

### 4. Response Transformation

Transform responses with DTOs:

```typescript
import { Controller, Get, Serialize } from 'clearboot';
import { Exclude, Expose } from 'class-transformer';

class User {
    id: number;
    name: string;
    email: string;
    passwordHash: string;  // Sensitive field
}

class UserDTO {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() email: string;
    @Exclude() passwordHash: string;  // Won't be sent
}

@Controller('/users')
class UserController {
    @Get('/:id')
    @Serialize(UserDTO)
    getUser() {
        return {
            id: 1,
            name: 'John',
            email: 'john@example.com',
            passwordHash: 'secret'  // Excluded automatically
        };
    }
}
```

### 5. HTTP Response

Control HTTP status codes and headers:

```typescript
import { Controller, Post, HttpCode, Header } from 'clearboot';

@Injectable()
class ApiHeaderProvider implements IHeaderProvider {
    getHeaders(): Record<string, string> {
        return {
            'X-API-Version': '1.0',
            'X-Powered-By': 'ClearBoot'
        };
    }
}

@Controller('/api')
class ApiController {
    @Post('/data')
    @HttpCode(201)  // Set status code to 201
    @Header(ApiHeaderProvider)  // Add custom headers
    createData() {
        return { id: 1 };
    }
}
```

### 6. Middleware

Add cross-cutting concerns with middleware:

```typescript
import { Controller, Get, Middleware, Injectable, IMiddleware } from 'clearboot';

@Injectable()
class LoggerMiddleware implements IMiddleware {
    async use(req: any, res: any, next: () => Promise<void>) {
        console.log(`${req.method} ${req.url}`);
        await next();
        console.log(`Response: ${res.statusCode}`);
    }
}

@Injectable()
class AuthMiddleware implements IMiddleware {
    async use(req: any, res: any, next: () => Promise<void>) {
        const token = req.headers.authorization;
        if (!token) {
            res.writeHead(401).end('Unauthorized');
            return;
        }
        req.user = { id: 1 };  // Simulate authenticated user
        await next();
    }
}

@Controller('/api')
@Middleware(LoggerMiddleware)  // Applied to all routes
class ApiController {
    @Get('/public')
    publicRoute() {
        return { status: 'public' };
    }

    @Get('/secure')
    @Middleware(AuthMiddleware)  // Applied only to this route
    secureRoute() {
        return { status: 'secure' };
    }
}
```

### 7. Dependency Injection

Share instances across your application:

```typescript
import { Injectable, inject } from 'clearboot';

@Injectable()
class DatabaseService {
    query(sql: string) {
        return [];
    }
}

@Injectable()
class UserRepository {
    constructor(private db: DatabaseService) {}

    findAll() {
        return this.db.query('SELECT * FROM users');
    }
}

@Injectable()
class UserService {
    constructor(private repo: UserRepository) {}

    getUsers() {
        return this.repo.findAll();
    }
}

@Controller('/users')
class UserController {
    constructor(private userService: UserService) {}

    @Get('/')
    getAllUsers() {
        return this.userService.getUsers();
    }
}
```

---

## Complete Example

Here's a complete user management API:

```typescript
// main.ts
import { Application } from 'clearboot';
import { UserController } from './controllers/user.controller';
import { ErrorHandlerMiddleware } from './middleware/error-handler.middleware';

const app = new Application();

// Global middleware
app.use(ErrorHandlerMiddleware);

// Register controllers
app.scan(UserController);

// Start server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
```

```typescript
// services/user.service.ts
import { Injectable } from 'clearboot';

@Injectable()
class UserService {
    private users = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' }
    ];

    getAll() {
        return this.users;
    }

    getById(id: number) {
        const user = this.users.find(u => u.id === id);
        if (!user) throw new Error('User not found');
        return user;
    }

    create(data: any) {
        const user = {
            id: Math.max(...this.users.map(u => u.id)) + 1,
            ...data
        };
        this.users.push(user);
        return user;
    }
}
```

```typescript
// dtos/user.dto.ts
import { Expose, Exclude } from 'class-transformer';

export class UserDTO {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    email: string;

    @Exclude()
    passwordHash?: string;
}
```

```typescript
// controllers/user.controller.ts
import { Controller, Get, Post, Param, Body, Serialize, Validate, HttpCode } from 'clearboot';
import { z } from 'zod';
import { UserService } from '../services/user.service';
import { UserDTO } from '../dtos/user.dto';

const CreateUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email()
});

@Controller('/users')
class UserController {
    constructor(private userService: UserService) {}

    @Get('/')
    @Serialize(UserDTO)
    getAllUsers() {
        return this.userService.getAll();
    }

    @Get('/:id')
    @Serialize(UserDTO)
    getUserById(@Param('id') id: string) {
        return this.userService.getById(parseInt(id));
    }

    @Post('/')
    @HttpCode(201)
    @Validate(CreateUserSchema)
    @Serialize(UserDTO)
    createUser(@Body() body: any) {
        return this.userService.create(body);
    }
}

export { UserController };
```

---

## Testing Your API

```typescript
import request from 'supertest';
import { Application } from 'clearboot';

describe('User API', () => {
    let server: any;

    beforeEach(() => {
        const app = new Application();
        app.scan(UserController);
        server = app.getServer();
    });

    test('should list all users', async () => {
        const res = await request(server).get('/users');
        expect(res.status).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
    });

    test('should create user', async () => {
        const res = await request(server)
            .post('/users')
            .send({ name: 'Bob', email: 'bob@example.com' });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.name).toBe('Bob');
    });

    test('should validate input', async () => {
        const res = await request(server)
            .post('/users')
            .send({ name: 'B', email: 'invalid' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation Failed');
    });
});
```

---

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── controllers/            # Route handlers
│   ├── user.controller.ts
│   └── product.controller.ts
├── services/               # Business logic
│   ├── user.service.ts
│   └── product.service.ts
├── repositories/           # Data access
│   ├── user.repository.ts
│   └── product.repository.ts
├── middlewares/            # HTTP middleware
│   ├── auth.middleware.ts
│   └── logger.middleware.ts
├── dtos/                   # Data transfer objects
│   ├── user.dto.ts
│   └── product.dto.ts
└── exceptions/             # Custom errors
    └── app.exceptions.ts

test/
├── unit/                   # Unit tests
├── integration/            # Integration tests
└── fixtures/               # Test data
```

---

## What's Next?

- **[Controllers](/docs/controllers.md)** - Deep dive into controllers
- **[Validation](/docs/validation.md)** - Input validation patterns
- **[Dependency Injection](/docs/dependency-injection-advanced.md)** - Service management
- **[Middlewares](/docs/middlewares.md)** - Cross-cutting concerns
- **[Patterns](/docs/patterns.md)** - Architectural patterns
- **[Testing](/docs/testing.md)** - Test strategies
- **[Configuration](/docs/configuration.md)** - App configuration
- **[Exceptions](/docs/exceptions.md)** - Error handling

---

## Common Questions

**Q: Do I need Express?**
A: No! ClearBoot uses Node.js native HTTP module. No external dependencies for the core framework.

**Q: How do I connect to a database?**
A: Create a service and inject it:
```typescript
@Injectable()
class DatabaseService {
    // Your database code
}
```

**Q: Can I use it in production?**
A: Yes! ClearBoot is production-ready. The framework is minimal and focused on stability.

**Q: How do I handle errors?**
A: Create custom error classes and global error middleware:
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

app.use(ErrorHandlerMiddleware);
```

**Q: How do I set environment variables?**
A: Use `process.env`:
```typescript
const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;
```

---

## Getting Help

- 📚 [Full Documentation](/docs/)
- 🧪 [Testing Examples](/docs/testing.md)
- 🏗️ [Architecture Patterns](/docs/patterns.md)
- 💡 [Advanced DI Patterns](/docs/dependency-injection-advanced.md)
