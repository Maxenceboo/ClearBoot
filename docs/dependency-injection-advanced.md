# Dependency Injection

ClearBoot includes a lightweight Dependency Injection (DI) container that manages application dependencies, enabling loose coupling, testability, and clean architecture.

---

## Overview

### What is Dependency Injection?

Dependency Injection is a pattern where objects receive their dependencies rather than creating them directly. This enables:

- **Testability**: Easy to mock dependencies in tests
- **Flexibility**: Swap implementations without changing code
- **Maintainability**: Clear dependency graphs
- **Reusability**: Share instances across the application

### ClearBoot DI Features

- Single `globalContainer` instance
- `@Injectable()` decorator for marking injectable classes
- `inject<T>()` function for resolving services
- Automatic class instantiation and caching
- Constructor injection support

---

## Basic Usage

### Marking Classes as Injectable

```typescript
import { Injectable } from 'clearboot';

@Injectable()
class UserService {
    getUser(id: number) {
        return { id, name: 'John' };
    }
}
```

### Registering Classes

Classes are automatically registered when decorated with `@Injectable()`:

```typescript
import { globalContainer, Injectable } from 'clearboot';

@Injectable()
class Database {
    connect() {
        console.log('Connected to DB');
    }
}

// Register manually (if not using decorator)
globalContainer.register(Database, () => new Database());
```

### Resolving Dependencies

```typescript
import { inject } from 'clearboot';

class UserController {
    getUserData() {
        const userService = inject(UserService);
        return userService.getUser(1);
    }
}
```

---

## Constructor Injection

### Pattern: Inject in Constructor

```typescript
import { Injectable } from 'clearboot';

@Injectable()
class Database {
    query(sql: string) {
        return [];
    }
}

@Injectable()
class UserRepository {
    constructor(private db: Database) {}

    findUser(id: number) {
        return this.db.query(`SELECT * FROM users WHERE id = ${id}`);
    }
}

@Injectable()
class UserService {
    constructor(private repo: UserRepository) {}

    getUser(id: number) {
        return this.repo.findUser(id);
    }
}
```

### Resolving the Chain

```typescript
import { inject } from 'clearboot';

const userService = inject(UserService);
// Automatically resolves:
// UserService → UserRepository → Database
```

---

## Real-World Examples

### Example 1: Header Provider

The `@Header` decorator uses DI to inject header providers:

```typescript
import { Injectable, IHeaderProvider } from 'clearboot';

@Injectable()
class ApiHeaderProvider implements IHeaderProvider {
    constructor(private config: ConfigService) {}

    getHeaders(): Record<string, string> {
        return {
            'X-API-Version': this.config.apiVersion,
            'X-Powered-By': 'ClearBoot',
            'X-Request-ID': this.generateId()
        };
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
}

@Controller('/api')
class ApiController {
    @Get('/data')
    @Header(ApiHeaderProvider)  // DI container injects the provider
    getData() {
        return { status: 'ok' };
    }
}
```

### Example 2: Service Chain

```typescript
@Injectable()
class LoggerService {
    log(message: string) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }
}

@Injectable()
class EmailService {
    constructor(private logger: LoggerService) {}

    send(to: string, subject: string) {
        this.logger.log(`Sending email to ${to}`);
        // Send email...
    }
}

@Injectable()
class UserService {
    constructor(
        private db: Database,
        private email: EmailService,
        private logger: LoggerService
    ) {}

    registerUser(data: any) {
        this.logger.log('Registering new user');
        // Create user...
        this.email.send(data.email, 'Welcome!');
        return user;
    }
}
```

### Example 3: Configuration Service

```typescript
@Injectable()
class ConfigService {
    private config: any;

    constructor() {
        this.config = {
            port: process.env.PORT || 3000,
            apiVersion: process.env.API_VERSION || '1.0',
            apiKey: process.env.API_KEY
        };
    }

    get(key: string): any {
        return this.config[key];
    }
}

@Injectable()
class AuthService {
    constructor(private config: ConfigService) {}

    authenticate(apiKey: string): boolean {
        return apiKey === this.config.get('apiKey');
    }
}

@Controller('/api')
class ApiController {
    constructor(private auth: AuthService) {}

    @Get('/secure')
    @Middleware(AuthMiddleware)
    getSecure() {
        return { data: 'sensitive' };
    }
}
```

---

## Advanced Patterns

### Factory Functions

```typescript
import { globalContainer } from 'clearboot';

class DatabaseConnection {
    constructor(private url: string) {}
}

// Register with factory function
globalContainer.register(DatabaseConnection, () => {
    const url = process.env.DATABASE_URL || 'localhost:5432';
    return new DatabaseConnection(url);
});

// Use normally
const db = inject(DatabaseConnection);
```

### Singleton Pattern

```typescript
@Injectable()
class CacheService {
    private cache = new Map<string, any>();

    set(key: string, value: any) {
        this.cache.set(key, value);
    }

    get(key: string) {
        return this.cache.get(key);
    }
}

// Same instance across entire application
const cache1 = inject(CacheService);
const cache2 = inject(CacheService);
console.log(cache1 === cache2); // true
```

### Optional Dependencies

```typescript
import { globalContainer } from 'clearboot';

@Injectable()
class AnalyticsService {
    constructor(private logger?: LoggerService) {}

    track(event: string) {
        this.logger?.log(`Event: ${event}`);
    }
}
```

---

## Testing with DI

### Mocking Dependencies

```typescript
import { globalContainer } from 'clearboot';

describe('UserService', () => {
    let userService: UserService;
    let mockRepository: MockUserRepository;

    beforeEach(() => {
        // Create mock
        mockRepository = {
            findUser: jest.fn().mockReturnValue({ id: 1, name: 'John' })
        };

        // Register mock
        globalContainer.register(UserRepository, () => mockRepository as any);

        // Resolve service with mocked dependency
        userService = inject(UserService);
    });

    test('should get user', () => {
        const user = userService.getUser(1);
        expect(user.name).toBe('John');
        expect(mockRepository.findUser).toHaveBeenCalledWith(1);
    });
});
```

### Testing Header Providers

```typescript
import { inject } from 'clearboot';

describe('ApiHeaderProvider', () => {
    test('should return headers', () => {
        const provider = inject(ApiHeaderProvider);
        const headers = provider.getHeaders();

        expect(headers['X-API-Version']).toBeDefined();
        expect(headers['X-Powered-By']).toBe('ClearBoot');
    });
});
```

---

## Best Practices

### ✅ DO:
- ✅ Use `@Injectable()` for classes you want to inject
- ✅ Inject dependencies in constructor
- ✅ Keep services focused and single-responsibility
- ✅ Use interfaces for contracts between services
- ✅ Mock dependencies in tests

### ❌ DON'T:
- ❌ Create instances directly (new ServiceClass())
- ❌ Store state in services that should be stateless
- ❌ Create circular dependencies
- ❌ Hardcode external dependencies
- ❌ Skip dependency injection for testing

---

## Troubleshooting

**Issue: "Service not found in container"**
- Ensure the class is decorated with `@Injectable()`
- Check that you're using `inject<T>()` with the correct class

**Issue: Constructor not being called**
- Verify the class has `@Injectable()` decorator
- Check that constructor parameters are also decorated

**Issue: Services not sharing state**
- Ensure you're using the same instance via `inject()`
- Check that services are decorated with `@Injectable()`

---

## API Reference

### `@Injectable()`
Marks a class as injectable.

```typescript
@Injectable()
class MyService {}
```

### `inject<T>(ServiceClass: class): T`
Resolves and returns an instance of the service.

```typescript
const service = inject(UserService);
```

### `globalContainer`
The global DI container instance.

```typescript
import { globalContainer } from 'clearboot';

globalContainer.register(Service, () => new Service());
```

---

## Migration Guide

### From Manual Instantiation

**Before:**
```typescript
class UserController {
    private userService = new UserService();

    getUser(id: number) {
        return this.userService.getUser(id);
    }
}
```

**After:**
```typescript
@Injectable()
class UserService {
    getUser(id: number) {
        // ...
    }
}

@Controller('/users')
class UserController {
    constructor(private userService: UserService) {}

    @Get('/:id')
    getUser(@Param('id') id: string) {
        return this.userService.getUser(parseInt(id));
    }
}
```

### From Global Variables

**Before:**
```typescript
const database = new Database();
const userService = new UserService(database);

export { database, userService };
```

**After:**
```typescript
@Injectable()
class Database {}

@Injectable()
class UserService {
    constructor(private db: Database) {}
}

// Use: const service = inject(UserService);
```
