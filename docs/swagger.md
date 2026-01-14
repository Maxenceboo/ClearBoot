# Swagger/OpenAPI Integration Guide

ClearBoot v2.0.3 includes built-in Swagger/OpenAPI documentation generation. Automatically generate interactive API documentation from your decorators.

---

## Installation

Already included! No additional setup needed beyond `npm install clearboot`.

---

## Quick Start

### 1. Decorate Your Endpoints

```typescript
import { 
    Controller, Get, Post, Param, Body,
    ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBody
} from 'clearboot';
import { z } from 'zod';

const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
});

@Controller('/users')
@ApiTags('Users')
class UserController {
    @Get('/')
    @ApiOperation('List Users', 'Get all users from database')
    @ApiResponse(200, 'Users retrieved', UserSchema)
    listUsers() {
        return [{ id: 1, name: 'Alice', email: 'alice@example.com' }];
    }

    @Get('/:id')
    @ApiOperation('Get User', 'Get a specific user by ID')
    @ApiParam('id', 'number', 'User ID')
    @ApiResponse(200, 'User found', UserSchema)
    @ApiResponse(404, 'User not found')
    getUser(@Param('id') id: string) {
        return { id: parseInt(id), name: 'Alice', email: 'alice@example.com' };
    }

    @Post('/')
    @ApiOperation('Create User', 'Create a new user')
    @ApiBody(UserSchema, 'User data')
    @ApiResponse(201, 'User created', UserSchema)
    createUser(@Body() body: any) {
        return { id: 1, ...body };
    }
}
```

### 2. Setup Swagger UI

```typescript
import { ClearBoot, SwaggerManager } from 'clearboot';
import { UserController } from './controllers/user.controller';

const app = ClearBoot.create();

// Setup Swagger documentation
SwaggerManager.setup(app, {
    title: 'My API',
    description: 'API Documentation',
    version: '1.0.0',
    contact: {
        name: 'Support',
        email: 'support@example.com',
    },
}, [UserController], '/api/docs');

console.log('📚 Swagger UI available at http://localhost:3000/api/docs');
```

### 3. Access Documentation

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs/spec.json
- **OpenAPI YAML**: Convert JSON to YAML as needed

---

## Available Decorators

### Operation Documentation

#### `@ApiOperation(summary, description?)`
Document what an endpoint does.

```typescript
@Get('/users')
@ApiOperation('List Users', 'Fetch all users from the database')
listUsers() { ... }
```

**Parameters:**
- `summary` (string): Short description (required)
- `description` (string): Detailed explanation (optional)

---

#### `@ApiTags(...tags)`
Group related endpoints together (works on class or method).

```typescript
@Controller('/users')
@ApiTags('Users', 'Public')
class UserController { ... }
```

---

### Parameter Documentation

#### `@ApiParam(name, type, description?, required?)`
Document route parameters (`:id`, `:slug`, etc.).

```typescript
@Get('/:id')
@ApiParam('id', 'number', 'User ID', true)
getUser(@Param('id') id: string) { ... }
```

**Parameters:**
- `name` (string): Parameter name
- `type` (string): Data type ('string', 'number', 'boolean')
- `description` (string): Parameter description
- `required` (boolean): Default is `true`

---

#### `@ApiQuery(name, type, description?, required?)`
Document query parameters (`?limit=10&offset=0`).

```typescript
@Get('/users')
@ApiQuery('limit', 'number', 'Items per page', false)
@ApiQuery('offset', 'number', 'Pagination offset', false)
listUsers(@Query('limit') limit?: string) { ... }
```

**Parameters:**
- Same as `@ApiParam`
- `required` defaults to `false` for query params

---

#### `@ApiHeader(name, type, description?)`
Document custom request headers.

```typescript
@Get('/profile')
@ApiHeader('X-API-Key', 'string', 'API authentication key')
getProfile() { ... }
```

---

### Request & Response Documentation

#### `@ApiBody(schema, description?)`
Document request body.

```typescript
const CreateUserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
});

@Post('/users')
@ApiBody(CreateUserSchema, 'User data to create')
createUser(@Body() body: any) { ... }
```

**Parameters:**
- `schema` (Zod schema or object): Request schema
- `description` (string): Body description

---

#### `@ApiResponse(statusCode, description, schema?)`
Document possible responses.

```typescript
@Get('/users/:id')
@ApiResponse(200, 'User found', UserSchema)
@ApiResponse(404, 'User not found')
@ApiResponse(500, 'Server error')
getUser(@Param('id') id: string) { ... }
```

**Parameters:**
- `statusCode` (number): HTTP status code
- `description` (string): Response description
- `schema` (Zod schema, optional): Response data schema

---

#### `@ApiConsumes(contentType)`
Document accepted content types.

```typescript
@Post('/upload')
@ApiConsumes('multipart/form-data')
uploadFile(@Body() file: File) { ... }
```

---

#### `@ApiProduces(contentType)`
Document response content type.

```typescript
@Get('/export')
@ApiProduces('text/csv')
exportUsers() { ... }
```

---

### Security & Advanced

#### `@ApiSecurity(scheme?)`
Mark endpoint as requiring authentication.

```typescript
@Get('/profile')
@ApiSecurity('Bearer')
getProfile(@Headers('Authorization') token: string) { ... }
```

**Default**: `'Bearer'` for JWT tokens

---

#### `@ApiDeprecated()`
Mark endpoint as deprecated.

```typescript
@Get('/old-endpoint')
@ApiDeprecated()
oldMethod() { ... }
```

---

## Complete Example

```typescript
import { ClearBoot, Controller, Get, Post, Param, Body, Validate, Injectable, SwaggerManager } from 'clearboot';
import { z } from 'zod';

// === 1. Define Schemas ===
const CreatePostSchema = z.object({
    title: z.string().min(3),
    content: z.string().min(10),
    authorId: z.number(),
});

const PostSchema = CreatePostSchema.extend({
    id: z.number(),
    createdAt: z.string(),
});

// === 2. Service Layer ===
@Injectable()
class PostService {
    private posts = [
        { id: 1, title: 'First Post', content: 'Hello World!', authorId: 1, createdAt: new Date().toISOString() },
    ];

    findAll() {
        return this.posts;
    }

    findById(id: number) {
        return this.posts.find(p => p.id === id);
    }

    create(data: any) {
        const post = { id: this.posts.length + 1, ...data, createdAt: new Date().toISOString() };
        this.posts.push(post);
        return post;
    }
}

// === 3. Controller with Swagger Docs ===
@Controller('/posts')
@ApiTags('Posts', 'Public')
class PostController {
    private postService = inject(PostService);

    @Get('/')
    @ApiOperation('List Posts', 'Get all blog posts')
    @ApiResponse(200, 'Posts retrieved', PostSchema)
    listPosts() {
        return this.postService.findAll();
    }

    @Get('/:id')
    @ApiOperation('Get Post', 'Get a specific post by ID')
    @ApiParam('id', 'number', 'Post ID')
    @ApiResponse(200, 'Post found', PostSchema)
    @ApiResponse(404, 'Post not found')
    getPost(@Param('id') id: string) {
        return this.postService.findById(parseInt(id));
    }

    @Post('/')
    @ApiOperation('Create Post', 'Create a new blog post')
    @ApiBody(CreatePostSchema)
    @ApiResponse(201, 'Post created', PostSchema)
    @Validate(CreatePostSchema)
    createPost(@Body() body: any) {
        return this.postService.create(body);
    }
}

// === 4. Setup Application ===
const app = ClearBoot.create();

SwaggerManager.setup(app, {
    title: 'Blog API',
    version: '1.0.0',
    description: 'A simple blog API with Swagger documentation',
    contact: {
        name: 'API Support',
        email: 'support@blog.local',
    },
}, [PostController], '/api/docs');

console.log('✅ Server running on http://localhost:3000');
console.log('📚 Swagger UI available at http://localhost:3000/api/docs');
```

---

## Zod Schema Support

Swagger automatically converts Zod schemas to OpenAPI schemas:

```typescript
const UserSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string().email(),
    age: z.number().optional(),
    roles: z.array(z.enum(['admin', 'user'])),
});

@ApiResponse(200, 'User found', UserSchema)
getUser() { ... }

// Generated OpenAPI:
// {
//   "type": "object",
//   "properties": {
//     "id": { "type": "number" },
//     "name": { "type": "string" },
//     "email": { "type": "string" },
//     "age": { "type": "number" },
//     "roles": { "type": "array", "items": { "type": "string", "enum": ["admin", "user"] } }
//   },
//   "required": ["id", "name", "email", "roles"]
// }
```

---

## Getting the Spec Programmatically

```typescript
import { SwaggerManager } from 'clearboot';

// Get the full OpenAPI spec
const spec = SwaggerManager.getSpec();

// Get as JSON string
const json = SwaggerManager.getSpecJSON();

// Use with external tools
console.log(json);
```

---

## Testing Swagger Integration

```typescript
describe('Swagger', () => {
    it('should have documentation', async () => {
        const response = await request(app).get('/api/docs');
        expect(response.status).toBe(200);
    });

    it('should have OpenAPI spec', async () => {
        const response = await request(app).get('/api/docs/spec.json');
        expect(response.status).toBe(200);
        expect(response.body.openapi).toBe('3.0.0');
    });
});
```

---

## Best Practices

1. **Use Zod schemas**: Let Swagger infer types from your validation schemas
2. **Document all endpoints**: Add `@ApiOperation` to every public endpoint
3. **Use meaningful tags**: Organize endpoints with `@ApiTags`
4. **Document errors**: Use `@ApiResponse` for error codes
5. **Keep it sync**: Update decorators when you change endpoints
6. **Test it**: Verify Swagger UI loads and spec is valid

---

## Customization

### Custom API Path

```typescript
SwaggerManager.setup(app, config, controllers, '/docs');  // Custom path
```

### Multiple Servers

```typescript
SwaggerManager.setup(app, {
    title: 'My API',
    version: '1.0.0',
    servers: [
        { url: 'http://localhost:3000', description: 'Development' },
        { url: 'https://api.example.com', description: 'Production' },
    ],
}, controllers);
```

---

## Common Issues

### Schema not showing in Swagger

Make sure you're passing the Zod schema to `@ApiResponse` and `@ApiBody`:

```typescript
// ✅ Correct
@ApiResponse(200, 'User', UserSchema)

// ❌ Wrong
@ApiResponse(200, 'User')
```

### Tags not appearing

Use `@ApiTags` on the controller class:

```typescript
// ✅ Correct
@Controller('/users')
@ApiTags('Users')
class UserController { ... }
```

### Spec endpoint not working

Make sure you called `SwaggerManager.setup()` before starting the server:

```typescript
const app = ClearBoot.create();
SwaggerManager.setup(app, config, controllers);  // Before any requests
```

---

## See Also

- [Feature Decorators](feature-decorators.md)
- [Controllers Guide](controllers-guide.md)
- [OpenAPI 3.0 Specification](https://spec.openapis.org/oas/v3.0.3)
