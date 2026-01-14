# Architectural Patterns

This guide covers common architectural patterns and best practices in ClearBoot applications.

---

## Table of Contents

1. [MVC Pattern](#mvc-pattern)
2. [Service Layer Pattern](#service-layer-pattern)
3. [Repository Pattern](#repository-pattern)
4. [Middleware Chain Pattern](#middleware-chain-pattern)
5. [Dynamic Headers Pattern](#dynamic-headers-pattern)
6. [Request/Response Transformation](#requestresponse-transformation)
7. [Error Handling Pattern](#error-handling-pattern)

---

## MVC Pattern

Model-View-Controller separates concerns into three layers.

### Structure

```
controllers/
├── user.controller.ts
└── product.controller.ts

models/
├── user.model.ts
└── product.model.ts

views/ (DTOs)
├── user.dto.ts
└── product.dto.ts
```

### Implementation

```typescript
// user.model.ts - Domain Model
class User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

// user.dto.ts - View (what client sees)
import { Exclude, Expose } from "class-transformer";

export class UserDTO {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Exclude()
  passwordHash: string;
}

// user.controller.ts - Controller
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Serialize,
  Validate,
} from "clearboot";
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

@Controller("/users")
class UserController {
  private userService = inject(UserService);

  @Get("/:id")
  @Serialize(UserDTO)
  async getUser(@Param("id") id: string) {
    return this.userService.findById(parseInt(id));
  }

  @Post("/")
  @HttpCode(201)
  @Validate(CreateUserSchema)
  @Serialize(UserDTO)
  async createUser(@Body() data: any) {
    return this.userService.create(data);
  }
}
```

---

## Service Layer Pattern

Encapsulates business logic in services, keeping controllers thin.

### Structure

```
services/
├── user.service.ts
├── email.service.ts
└── notification.service.ts

repositories/
├── user.repository.ts
└── product.repository.ts
```

### Implementation

```typescript
// user.repository.ts
@Injectable()
class UserRepository {
  private db = inject(Database);

  async findById(id: number): Promise<User | null> {
    return this.db.query("SELECT * FROM users WHERE id = ?", [id]);
  }

  async create(user: Partial<User>): Promise<User> {
    const result = await this.db.query(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [user.name, user.email],
    );
    return { ...user, id: result.insertId };
  }

  async update(id: number, user: Partial<User>): Promise<User> {
    await this.db.query("UPDATE users SET name = ?, email = ? WHERE id = ?", [
      user.name,
      user.email,
      id,
    ]);
    return this.findById(id);
  }
}

// user.service.ts
@Injectable()
class UserService {
  private repo = inject(UserRepository);
  private email = inject(EmailService);
  private logger = inject(LoggerService);

  async registerUser(data: any): Promise<User> {
    this.logger.log(`Registering user: ${data.email}`);

    // Business logic
    const existingUser = await this.repo.findByEmail(data.email);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    const user = await this.repo.create({
      name: data.name,
      email: data.email,
      passwordHash: await this.hashPassword(data.password),
    });

    // Send welcome email
    await this.email.send(data.email, "Welcome to our app!");

    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    // Implementation
    return password; // Simplified
  }
}

// user.controller.ts
@Controller("/users")
class UserController {
  private userService = inject(UserService);

  @Post("/register")
  @Validate(RegisterSchema)
  @Serialize(UserDTO)
  async register(@Body() data: any) {
    return this.userService.registerUser(data);
  }
}
```

---

## Repository Pattern

Abstracts data access logic behind a consistent interface.

### Interface-Based Approach

```typescript
// interfaces/repository.interface.ts
export interface IRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
}

// repositories/user.repository.ts
@Injectable()
class UserRepository implements IRepository<User> {
  private db = inject(Database);

  async findAll(): Promise<User[]> {
    return this.db.query("SELECT * FROM users");
  }

  async findById(id: number): Promise<User | null> {
    const result = await this.db.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);
    return result[0] || null;
  }

  async create(data: Partial<User>): Promise<User> {
    // Implementation
  }

  async update(id: number, data: Partial<User>): Promise<User> {
    // Implementation
  }

  async delete(id: number): Promise<void> {
    // Implementation
  }
}

// Using the repository
@Controller("/users")
class UserController {
  private userRepo = inject(UserRepository);

  @Get("/")
  async getAll() {
    return this.userRepo.findAll();
  }

  @Get("/:id")
  async getOne(@Param("id") id: string) {
    return this.userRepo.findById(parseInt(id));
  }
}
```

---

## Middleware Chain Pattern

Build request processing pipelines with middleware composition.

### Structure

```typescript
@Controller("/api")
@Middleware(AuthMiddleware) // Applied first
@Middleware(LoggerMiddleware) // Applied second
class ApiController {
  @Get("/data")
  @Middleware(RateLimitMiddleware) // Applied third
  getData() {
    return { status: "ok" };
  }
}
```

### Request Flow

```
Request
  ↓
[AuthMiddleware] - Verify authentication
  ↓
[LoggerMiddleware] - Log request
  ↓
[RateLimitMiddleware] - Check rate limits
  ↓
[Handler] - Execute route handler
  ↓
Response
```

### Implementation

```typescript
@Injectable()
class AuthMiddleware implements IMiddleware {
  private authService = inject(AuthService);

  async use(req: any, res: any, next: () => Promise<void>) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.writeHead(401).end("Unauthorized");
    }

    try {
      req.user = this.authService.verify(token);
      await next();
    } catch (error) {
      res.writeHead(401).end("Invalid token");
    }
  }
}

@Injectable()
class LoggerMiddleware implements IMiddleware {
  async use(req: any, res: any, next: () => Promise<void>) {
    const start = Date.now();
    await next();
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${duration}ms`);
  }
}

@Controller("/api")
@Middleware(AuthMiddleware)
@Middleware(LoggerMiddleware)
class ApiController {
  @Get("/users")
  getUsers() {
    return { users: [] };
  }
}
```

---

## Dynamic Headers Pattern

Inject headers dynamically based on application state.

### Using Header Providers

```typescript
// http/api-header-provider.ts
@Injectable()
class ApiHeaderProvider implements IHeaderProvider {
  constructor(
    private config: ConfigService,
    private logger: LoggerService,
  ) {}

  getHeaders(): Record<string, string> {
    const requestId = this.generateRequestId();
    this.logger.log(`Generated request ID: ${requestId}`);

    return {
      "X-API-Version": this.config.get("apiVersion"),
      "X-Request-ID": requestId,
      "X-Powered-By": "ClearBoot",
      "Cache-Control": "no-cache",
    };
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// http/security-header-provider.ts
@Injectable()
class SecurityHeaderProvider implements IHeaderProvider {
  getHeaders(): Record<string, string> {
    return {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    };
  }
}

// controllers/api.controller.ts
@Controller("/api")
class ApiController {
  @Get("/public")
  @Header(ApiHeaderProvider)
  getPublic() {
    return { status: "ok" };
  }

  @Get("/secure")
  @Header(ApiHeaderProvider)
  @Header(SecurityHeaderProvider)
  @Middleware(AuthMiddleware)
  getSecure() {
    return { status: "ok" };
  }
}
```

---

## Request/Response Transformation

Transform data at input and output boundaries.

### Full Pipeline

```typescript
const CreateUserSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
  })
  .transform((data) => ({
    ...data,
    email: data.email.toLowerCase(),
  }));

class CreateUserDTO {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Exclude()
  passwordHash: string;

  @Expose()
  @Transform(({ value }) => value.toISOString())
  createdAt: Date;
}

@Controller("/users")
class UserController {
  private userService = inject(UserService);

  @Post("/")
  @HttpCode(201)
  @Validate(CreateUserSchema) // Input transformation & validation
  @Serialize(CreateUserDTO) // Output transformation
  @Header(ApiHeaderProvider) // Add headers
  async create(@Body() data: any) {
    // At this point:
    // - data is validated
    // - email is lowercase
    // - response will be serialized to CreateUserDTO

    return this.userService.create(data);
  }
}
```

---

## Error Handling Pattern

Centralized error handling with custom error classes.

### Error Classes

```typescript
// exceptions/custom-error.ts
export class CustomError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any,
  ) {
    super(message);
  }
}

export class ValidationError extends CustomError {
  constructor(details: any) {
    super(400, "Validation Failed", details);
  }
}

export class NotFoundError extends CustomError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}
```

### Error Handler Middleware

```typescript
@Injectable()
class ErrorHandlerMiddleware implements IMiddleware {
  private logger = inject(LoggerService);

  async use(req: any, res: any, next: () => Promise<void>) {
    try {
      await next();
    } catch (error) {
      this.logger.error(`Error: ${error.message}`, error);

      if (error instanceof CustomError) {
        return res
          .writeHead(error.statusCode, { "Content-Type": "application/json" })
          .end(
            JSON.stringify({
              error: error.message,
              status: error.statusCode,
              details: error.details,
            }),
          );
      }

      // Generic error
      res.writeHead(500, { "Content-Type": "application/json" }).end(
        JSON.stringify({
          error: "Internal Server Error",
          status: 500,
        }),
      );
    }
  }
}

// Usage in service
@Injectable()
class UserService {
  private repo = inject(UserRepository);

  async getUser(id: number): Promise<User> {
    const user = await this.repo.findById(id);

    if (!user) {
      throw new NotFoundError("User");
    }

    return user;
  }
}
```

### Global Error Handling

```typescript
// main.ts
import { ClearBoot } from "clearboot";
import { ErrorHandlerMiddleware } from "./middlewares/error-handler.middleware";

ClearBoot.create({
  globalMiddlewares: [ErrorHandlerMiddleware],
});
```

---

## Best Practices Summary

| Pattern              | Use When                       | Benefits                              |
| -------------------- | ------------------------------ | ------------------------------------- |
| **MVC**              | Building traditional CRUD APIs | Clear separation, easy to understand  |
| **Service Layer**    | Complex business logic         | Reusable, testable, maintainable      |
| **Repository**       | Multiple data sources          | Abstraction, easy to switch databases |
| **Middleware Chain** | Cross-cutting concerns         | Composable, reusable, clean pipeline  |
| **Header Provider**  | Dynamic/conditional headers    | DI, testable, flexible                |
| **Transform**        | Input/output formatting        | Data integrity, consistent API        |
| **Error Handler**    | Exception management           | Centralized, consistent responses     |

---

## Complete Example: User Management API

```typescript
// Complete working example combining all patterns

// 1. Domain Model
class User {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: "user" | "admin";
  createdAt: Date;
}

// 2. DTO (View)
class UserDTO {
  @Expose() id: number;
  @Expose() name: string;
  @Expose() email: string;
  @Expose() role: string;
  @Exclude() passwordHash: string;
}

// 3. Repository
@Injectable()
class UserRepository {
  private db = inject(Database);
  // CRUD operations
}

// 4. Service Layer
@Injectable()
class UserService {
  private repo = inject(UserRepository);
  private email = inject(EmailService);

  async register(data: any) {
    // Business logic
  }
}

// 5. Middleware
@Injectable()
class AdminMiddleware implements IMiddleware {
  async use(req: any, res: any, next: () => Promise<void>) {
    if (req.user?.role !== "admin") {
      throw new UnauthorizedError("Admin access required");
    }
    await next();
  }
}

// 6. Controller
@Controller("/users")
@Middleware(AuthMiddleware)
class UserController {
  private userService = inject(UserService);

  @Post("/register")
  @Validate(RegisterSchema)
  @Serialize(UserDTO)
  @Header(ApiHeaderProvider)
  async register(@Body() data: any) {
    return this.userService.register(data);
  }

  @Get("/admin-stats")
  @Middleware(AdminMiddleware)
  @Serialize(AdminStatsDTO)
  async getAdminStats() {
    return this.userService.getStats();
  }
}

// 7. Application Setup
ClearBoot.create({
  globalMiddlewares: [ErrorHandlerMiddleware, LoggerMiddleware],
});
```

This complete example demonstrates:

- ✅ Clean separation of concerns
- ✅ Dependency injection
- ✅ Error handling
- ✅ Input validation
- ✅ Output serialization
- ✅ Middleware composition
- ✅ Authorization
