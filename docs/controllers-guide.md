# Controllers

Controllers are the heart of ClearBoot applications. They handle HTTP requests and return responses.

---

## Basic Controller

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
```

### Route Registration

```typescript
ClearBoot.create();

// Routes:
// GET  /users
// GET  /users/:id
// POST /users
// PUT  /users/:id
// DELETE /users/:id
```

---

## HTTP Verbs

ClearBoot supports all standard HTTP methods:

```typescript
import { Controller, Get, Post, Put, Delete, Patch, Head, Options } from 'clearboot';

@Controller('/api')
class ApiController {
    @Get('/data')
    getData() {
        return { data: [] };
    }

    @Post('/data')
    createData() {
        return { id: 1 };
    }

    @Put('/data/:id')
    updateData() {
        return { updated: true };
    }

    @Patch('/data/:id')
    patchData() {
        return { patched: true };
    }

    @Delete('/data/:id')
    deleteData() {
        return { deleted: true };
    }

    @Head('/data/:id')
    headData() {
        // Return empty - HEAD is like GET but no body
        return {};
    }

    @Options('/data')
    optionsData() {
        return {};
    }
}
```

---

## Path Parameters

Extract dynamic parts of the URL:

```typescript
import { Controller, Get, Param } from 'clearboot';

@Controller('/users')
class UserController {
    @Get('/:id')
    getUser(@Param('id') id: string) {
        return { id };
    }

    @Get('/:userId/posts/:postId')
    getUserPost(@Param('userId') userId: string, @Param('postId') postId: string) {
        return { userId, postId };
    }

    @Get('/:category/:subcategory')
    getCategory(@Param('category') cat: string, @Param('subcategory') subcat: string) {
        return { category: cat, subcategory: subcat };
    }
}

// Requests:
// GET /users/123 → { id: "123" }
// GET /users/123/posts/456 → { userId: "123", postId: "456" }
// GET /products/electronics/phones → { category: "electronics", subcategory: "phones" }
```

### Route Parameter Validation with Regex

Add regex patterns to validate parameter format at routing level:

```typescript
@Controller('/api')
class ApiController {
    @Get('/users/:id(\\d+)')           // Only numbers
    getUser(@Param('id') id: string) {
        return { id };
    }

    @Get('/posts/:slug([a-z-]+)')       // Only lowercase + hyphens
    getPost(@Param('slug') slug: string) {
        return { slug };
    }

    @Get('/files/:name(.+\\.\\w+)')     // Filename with extension
    downloadFile(@Param('name') name: string) {
        return { file: name };
    }
}

// GET /users/123 → matches (123 is digits)
// GET /users/abc → 404 (abc doesn't match \d+)
// GET /posts/hello-world → matches
// GET /posts/Hello → 404 (capital H doesn't match [a-z-]+)
```

---

## Query Parameters

Access query string parameters:

```typescript
import { Controller, Get, Query } from 'clearboot';

@Controller('/search')
class SearchController {
    @Get('/')
    search(@Query() params: any) {
        const { q, limit, offset } = params;
        return {
            query: q,
            limit: limit || 20,
            offset: offset || 0
        };
    }

    @Get('/advanced')
    advancedSearch(@Query() params: any) {
        return {
            keyword: params.keyword,
            sort: params.sort || 'relevance',
            filters: params.filter  // Could be array if multiple
        };
    }
}

// Requests:
// GET /search?q=javascript → { query: "javascript", limit: 20, offset: 0 }
// GET /search/advanced?keyword=python&sort=date&filter=verified
```

---

## Request Body

Extract and process request body:

```typescript
import { Controller, Post, Body } from 'clearboot';

@Controller('/users')
class UserController {
    @Post('/')
    createUser(@Body() body: any) {
        return {
            id: 1,
            name: body.name,
            email: body.email
        };
    }

    @Post('/bulk')
    createBulk(@Body() body: any) {
        // body.users is an array
        return {
            created: body.users.length
        };
    }
}

// POST /users
// Body: { "name": "John", "email": "john@example.com" }
// Response: { "id": 1, "name": "John", "email": "john@example.com" }
```

---

## Raw Request/Response

Access the raw Node.js request and response objects:

```typescript
import { Controller, Get, Req, Res } from 'clearboot';

@Controller('/raw')
class RawController {
    @Get('/headers')
    getHeaders(@Req() req: any) {
        return {
            userAgent: req.headers['user-agent'],
            contentType: req.headers['content-type']
        };
    }

    @Get('/custom')
    custom(@Res() res: any) {
        res.writeHead(200, {
            'Content-Type': 'text/html',
            'X-Custom-Header': 'value'
        });
        res.end('<h1>Custom Response</h1>');
    }

    @Get('/stream')
    stream(@Res() res: any) {
        res.writeHead(200, { 'Content-Type': 'application/json' });

        for (let i = 0; i < 5; i++) {
            res.write(JSON.stringify({ count: i }) + '\n');
        }

        res.end();
    }
}
```

---

## Combining Parameters

Mix different parameter types:

```typescript
import { Controller, Get, Post, Param, Query, Body } from 'clearboot';

@Controller('/api/users')
class UserController {
    @Get('/:id/posts')
    getUserPosts(
        @Param('id') userId: string,
        @Query() filters: any
    ) {
        return {
            userId,
            limit: filters.limit || 20,
            sort: filters.sort || 'newest'
        };
    }

    @Post('/:id/comments')
    addComment(
        @Param('id') userId: string,
        @Body() comment: any
    ) {
        return {
            userId,
            commentId: 1,
            text: comment.text,
            created: new Date()
        };
    }

    @Get('/:userId/friends/:friendId')
    checkFriendship(
        @Param('userId') userId: string,
        @Param('friendId') friendId: string,
        @Query() options: any
    ) {
        return {
            userId,
            friendId,
            isFriend: true,
            mutual: options.includeMutual === 'true'
        };
    }
}
```

---

## Multiple Controllers

Organize routes across multiple controller files:

```typescript
// controllers/user.controller.ts
@Controller('/users')
class UserController {
    @Get('/') getAll() { }
    @Get('/:id') getOne(@Param('id') id: string) { }
    @Post('/') create(@Body() body: any) { }
}

// controllers/product.controller.ts
@Controller('/products')
class ProductController {
    @Get('/') getAll() { }
    @Get('/:id') getOne(@Param('id') id: string) { }
    @Post('/') create(@Body() body: any) { }
}

// main.ts
ClearBoot.create();

// Routes:
// GET /users
// GET /users/:id
// POST /users
// GET /products
// GET /products/:id
// POST /products
```

---

## Prefix Paths

Add base path prefixes to controller routes:

```typescript
// All routes start with /api/v1/users
@Controller('/api/v1/users')
class UserController {
    @Get('/')              // GET /api/v1/users
    listUsers() { }

    @Get('/:id')           // GET /api/v1/users/:id
    getUser(@Param('id') id: string) { }

    @Post('/')             // POST /api/v1/users
    createUser(@Body() body: any) { }
}
```

---

## Return Types

Controllers can return various types:

```typescript
import { Controller, Get, Res } from 'clearboot';

@Controller('/return-types')
class ReturnTypesController {
    // Object - automatically JSON serialized
    @Get('/object')
    returnObject() {
        return { name: 'John' };
    }

    // Array - automatically JSON serialized
    @Get('/array')
    returnArray() {
        return [1, 2, 3];
    }

    // String - sent as-is
    @Get('/string')
    returnString() {
        return 'Hello World';
    }

    // Number - converted to JSON
    @Get('/number')
    returnNumber() {
        return 42;
    }

    // Boolean - converted to JSON
    @Get('/boolean')
    returnBoolean() {
        return true;
    }

    // Promise - awaited automatically
    @Get('/promise')
    async returnPromise() {
        return new Promise(resolve => {
            setTimeout(() => resolve({ delayed: true }), 100);
        });
    }

    // Custom response
    @Get('/custom')
    customResponse(@Res() res: any) {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Custom response');
    }
}
```

---

## Status Codes

Set HTTP status codes:

```typescript
import { Controller, Post, HttpCode } from 'clearboot';

@Controller('/api')
class ApiController {
    @Post('/data')
    @HttpCode(201)  // Created
    create() {
        return { id: 1 };
    }

    @Post('/accept')
    @HttpCode(202)  // Accepted
    accept() {
        return { status: 'processing' };
    }

    @Post('/redirect')
    @HttpCode(301)  // Moved Permanently
    redirect() {
        return { location: '/new-url' };
    }
}
```

### Common Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 202 | Accepted | Async request accepted |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Auth required |
| 403 | Forbidden | Auth successful, but denied |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unhandled exception |

---

## Dependency Injection

Inject services into controllers:

```typescript
import { Injectable } from 'clearboot';

@Injectable()
class UserService {
    getUser(id: number) {
        return { id, name: 'John' };
    }
}

@Controller('/users')
class UserController {
    private userService = inject(UserService);

    @Get('/:id')
    getUser(@Param('id') id: string) {
        return this.userService.getUser(parseInt(id));
    }
}
```

---

## Validation & Serialization

Validate and transform data:

```typescript
import { Controller, Post, Body, Validate, Serialize } from 'clearboot';
import { z } from 'zod';

const CreateUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email()
});

class UserDTO {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() email: string;
    @Exclude() passwordHash: string;
}

@Controller('/users')
class UserController {
    @Post('/')
    @Validate(CreateUserSchema)      // Validate input
    @Serialize(UserDTO)              // Transform output
    create(@Body() body: any) {
        return {
            id: 1,
            ...body,
            passwordHash: 'secret'
        };
    }
}
```

---

## Middleware

Apply middleware to routes:

```typescript
import { Controller, Get, Middleware } from 'clearboot';

@Injectable()
class AuthMiddleware implements IMiddleware {
    async use(req: any, res: any, next: () => Promise<void>) {
        if (!req.headers.authorization) {
            res.writeHead(401).end('Unauthorized');
            return;
        }
        await next();
    }
}

@Controller('/api')
@Middleware(AuthMiddleware)  // Apply to all routes
class ApiController {
    @Get('/public')
    public() {
        return { status: 'public' };
    }

    @Get('/private')
    @Middleware(AuthMiddleware)  // Apply to specific route
    private() {
        return { status: 'private' };
    }
}
```

---

## Best Practices

### ✅ DO:
- ✅ Keep controllers thin (delegate to services)
- ✅ Use descriptive route names
- ✅ Validate input with `@Validate`
- ✅ Serialize output with `@Serialize`
- ✅ Use dependency injection
- ✅ Return appropriate HTTP status codes
- ✅ Document routes with comments

### ❌ DON'T:
- ❌ Put business logic in controllers
- ❌ Access database directly in controllers
- ❌ Ignore validation errors
- ❌ Return internal models to clients
- ❌ Hardcode values
- ❌ Have controllers depend on HTTP framework details

---

## Example: Complete CRUD Controller

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body, Validate, Serialize, HttpCode } from 'clearboot';
import { z } from 'zod';

// Validation Schemas
const CreateProductSchema = z.object({
    name: z.string().min(2),
    price: z.number().positive(),
    description: z.string().optional()
});

const UpdateProductSchema = CreateProductSchema.partial();

// DTO
class ProductDTO {
    @Expose() id: number;
    @Expose() name: string;
    @Expose() price: number;
    @Expose() description?: string;
    @Exclude() internalId: string;
}

// Service
@Injectable()
class ProductService {
    private products = [
        { id: 1, name: 'Laptop', price: 999, description: '...' }
    ];

    getAll() {
        return this.products;
    }

    getById(id: number) {
        return this.products.find(p => p.id === id);
    }

    create(data: any) {
        const product = { id: Math.random(), ...data };
        this.products.push(product);
        return product;
    }

    update(id: number, data: any) {
        const index = this.products.findIndex(p => p.id === id);
        if (index >= 0) {
            this.products[index] = { ...this.products[index], ...data };
            return this.products[index];
        }
        return null;
    }

    delete(id: number) {
        this.products = this.products.filter(p => p.id !== id);
    }
}

// Controller
@Controller('/products')
class ProductController {
    private service = inject(ProductService);

    @Get('/')
    @Serialize(ProductDTO)
    getAll() {
        return this.service.getAll();
    }

    @Get('/:id')
    @Serialize(ProductDTO)
    getOne(@Param('id') id: string) {
        const product = this.service.getById(parseInt(id));
        if (!product) throw new Error('Product not found');
        return product;
    }

    @Post('/')
    @HttpCode(201)
    @Validate(CreateProductSchema)
    @Serialize(ProductDTO)
    create(@Body() body: any) {
        return this.service.create(body);
    }

    @Put('/:id')
    @Validate(UpdateProductSchema)
    @Serialize(ProductDTO)
    update(@Param('id') id: string, @Body() body: any) {
        const product = this.service.update(parseInt(id), body);
        if (!product) throw new Error('Product not found');
        return product;
    }

    @Delete('/:id')
    delete(@Param('id') id: string) {
        this.service.delete(parseInt(id));
        return { success: true };
    }
}
```

---

## Troubleshooting

**Issue: Route not found (404)**
- Verify ClearBoot.create() is called
- Check route path is correct
- Verify HTTP verb matches

**Issue: Parameters not working**
- Ensure parameter names match route: `/:id` matches `@Param('id')`
- Check parameter decorator is used
- Verify type casting if needed

**Issue: Body always undefined**
- Check `@Body()` decorator is used
- Verify request has `Content-Type: application/json`
- Check body is valid JSON
