# HTTP Response Decorators

## Overview

HTTP response decorators allow you to control the HTTP status code and headers sent back to the client. ClearBoot provides two powerful decorators:

- **`@HttpCode(code)`** - Set custom HTTP status codes
- **`@Header(HeaderProvider)`** - Dynamically inject and apply response headers

---

## @HttpCode Decorator

### Purpose
Sets the HTTP status code for the response. By default, all successful responses return `200 OK`.

### Syntax
```typescript
@HttpCode(statusCode: number)
```

### Basic Usage
```typescript
import { Controller, Post, HttpCode } from 'clearboot';

@Controller('/users')
class UserController {
    @Post('/register')
    @HttpCode(201)  // Returns 201 Created instead of 200
    register() {
        return { id: 1, message: 'User created' };
    }
}
```

### Common HTTP Status Codes
| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Default, successful request |
| 201 | Created | Resource successfully created (POST) |
| 204 | No Content | Successful but no content to return (DELETE) |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Authenticated but no access |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Real-World Examples
```typescript
@Controller('/products')
class ProductController {
    @Post('/')
    @HttpCode(201)
    create(@Body() product: any) {
        // Returns 201 Created
        return { id: 1, ...product };
    }

    @Delete('/:id')
    @HttpCode(204)
    delete(@Param('id') id: string) {
        // No content returned
        return;
    }

    @Get('/:id')
    @HttpCode(404)  // Custom: product not found
    getProduct(@Param('id') id: string) {
        // Simulate not found
        return null;
    }
}
```

---

## @Header Decorator

### Purpose
Dynamically inject and apply response headers using injectable classes. Headers are set on the HTTP response before sending to the client.

### Syntax
```typescript
@Header(HeaderProviderClass)
```

### Interface: IHeaderProvider
Any class used with `@Header` must implement `IHeaderProvider`:

```typescript
interface IHeaderProvider {
    getHeaders(): Record<string, string>;
}
```

### Basic Usage
```typescript
import { Controller, Post, Header, Injectable } from 'clearboot';
import { IHeaderProvider } from 'clearboot/common/interfaces';

// Create an injectable header provider
@Injectable()
class ApiHeaderProvider implements IHeaderProvider {
    getHeaders() {
        return {
            'X-API-Version': '2.0',
            'X-Powered-By': 'ClearBoot'
        };
    }
}

// Use it in a controller
@Controller('/api')
class ApiController {
    @Post('/data')
    @Header(ApiHeaderProvider)
    getData() {
        return { status: 'success' };
    }
}
```

### Response Headers
When the above route is called, the response will include:
```
HTTP/1.1 200 OK
X-API-Version: 2.0
X-Powered-By: ClearBoot
Content-Type: application/json
```

---

## Advanced: Dynamic Headers with Dependencies

Since header providers are injectable, you can access other services:

```typescript
import { Injectable, inject } from 'clearboot';

@Injectable()
class AuthService {
    generateToken() {
        return 'token_' + Date.now();
    }
}

@Injectable()
class SecurityHeaderProvider implements IHeaderProvider {
    constructor(private authService: AuthService) {}
    
    getHeaders() {
        return {
            'X-Token': this.authService.generateToken(),
            'X-Request-ID': Math.random().toString(36).substring(7),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'X-Content-Type-Options': 'nosniff'
        };
    }
}

@Controller('/secure')
class SecureController {
    @Post('/login')
    @Header(SecurityHeaderProvider)
    login() {
        return { user: 'john' };
    }
}
```

---

## Real-World Patterns

### Pattern 1: API Versioning
```typescript
@Injectable()
class VersionHeaderProvider implements IHeaderProvider {
    getHeaders() {
        return {
            'X-API-Version': '2.0',
            'X-API-Deprecated': 'false'
        };
    }
}

@Controller('/api/v2')
class ApiV2Controller {
    @Get('/users')
    @Header(VersionHeaderProvider)
    getUsers() {
        return [{ id: 1, name: 'John' }];
    }
}
```

### Pattern 2: Pagination Headers
```typescript
@Injectable()
class PaginationHeaderProvider implements IHeaderProvider {
    private page = 1;
    private pageSize = 20;
    private total = 100;

    getHeaders() {
        const totalPages = Math.ceil(this.total / this.pageSize);
        return {
            'X-Page': this.page.toString(),
            'X-Page-Size': this.pageSize.toString(),
            'X-Total-Count': this.total.toString(),
            'X-Total-Pages': totalPages.toString()
        };
    }
}

@Controller('/api')
class ApiController {
    @Get('/users')
    @Header(PaginationHeaderProvider)
    getUsers() {
        return [{ id: 1 }, { id: 2 }];
    }
}
```

### Pattern 3: CORS and Security Headers
```typescript
@Injectable()
class SecurityHeaderProvider implements IHeaderProvider {
    getHeaders() {
        return {
            'Access-Control-Allow-Origin': 'https://example.com',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
            'X-Frame-Options': 'SAMEORIGIN',
            'X-XSS-Protection': '1; mode=block',
            'X-Content-Type-Options': 'nosniff',
            'Strict-Transport-Security': 'max-age=31536000'
        };
    }
}
```

---

## Combining Decorators

You can combine `@HttpCode` and `@Header` on the same method:

```typescript
@Controller('/products')
class ProductController {
    @Post('/')
    @HttpCode(201)
    @Header(ApiHeaderProvider)
    create(@Body() product: any) {
        return { id: 1, ...product };
    }
}
```

Response will be:
```
HTTP/1.1 201 Created
X-API-Version: 2.0
X-Powered-By: ClearBoot
Content-Type: application/json

{ "id": 1, ... }
```

---

## Testing Headers

Since header providers are injectable, you can mock them in tests:

```typescript
describe('Headers', () => {
    test('should include custom headers', async () => {
        const response = await request(server)
            .post('/api/data')
            .expect('X-API-Version', '2.0')
            .expect('X-Powered-By', 'ClearBoot');
    });
});
```

---

## Key Points

✅ `@HttpCode` sets the HTTP status code
✅ `@Header` requires an injectable class implementing `IHeaderProvider`
✅ Headers can be dynamic based on dependencies
✅ Multiple header providers can be stacked
✅ Works with all HTTP verbs (@Get, @Post, @Put, @Delete, @Patch)
✅ Fully testable and mockable
