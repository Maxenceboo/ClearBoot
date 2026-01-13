# Feature Decorators

Feature decorators add powerful capabilities to your route handlers. This guide covers all feature decorators: `@Validate` and `@Serialize`.

---

## @Validate Decorator

### Purpose
Validates incoming request data against a Zod schema before your handler is executed. If validation fails, an error is thrown automatically.

### Syntax
```typescript
@Validate(zodSchema: ZodSchema)
```

### Installation
```bash
npm install zod
```

### Basic Usage
```typescript
import { Controller, Post, Body, Validate } from 'clearboot';
import { z } from 'zod';

// Define your validation schema
const UserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    age: z.number().min(18, "Must be 18 or older")
});

@Controller('/users')
class UserController {
    @Post('/register')
    @Validate(UserSchema)
    register(@Body() user: any) {
        // At this point, user is guaranteed to match the schema
        return { id: 1, ...user };
    }
}
```

### Validation Error Response
When validation fails:
```json
{
    "status": 400,
    "error": "Validation Failed",
    "details": {
        "name": {
            "_errors": ["String must contain at least 2 character(s)"]
        },
        "email": {
            "_errors": ["Invalid email"]
        }
    }
}
```

### Advanced Schemas
```typescript
// Nested objects
const OrderSchema = z.object({
    items: z.array(z.object({
        productId: z.number(),
        quantity: z.number().positive()
    })),
    shippingAddress: z.object({
        street: z.string(),
        city: z.string(),
        zipCode: z.string().regex(/^\d{5}$/)
    })
});

// Conditional validation
const PaymentSchema = z.object({
    method: z.enum(['credit_card', 'bank_transfer']),
    cardNumber: z.string().optional(),
    bankAccount: z.string().optional()
}).refine(
    data => {
        if (data.method === 'credit_card') return !!data.cardNumber;
        if (data.method === 'bank_transfer') return !!data.bankAccount;
        return false;
    },
    { message: "Provide required payment details" }
);

// Custom transformations
const ProductSchema = z.object({
    name: z.string(),
    price: z.string().transform(val => parseFloat(val))
}).transform(data => ({
    ...data,
    discountedPrice: data.price * 0.9
}));
```

### Validation Scope
`@Validate` validates the `@Body` parameter:

```typescript
@Controller('/api')
class ApiController {
    // Validates @Body only
    @Post('/users')
    @Validate(UserSchema)
    createUser(@Body() body: any) {
        return body;  // body is validated against UserSchema
    }
}
```

### Dynamic Routes with Regex
Route parameters support regex patterns to enforce validation at the routing level:

```typescript
@Get('/users/:id(\\d+)')        // Only matches numbers
@Get('/posts/:slug([a-z-]+)')   // Only matches lowercase + hyphens
@Get('/files/:name(.+\\.\\w+)')   // File with extension
get(@Param('id') id: string) {}
```

If the URL doesn't match the regex, it returns 404 automatically (no 400 validation error).

---

## @Serialize Decorator

### Purpose
Transforms the response object using a DTO (Data Transfer Object) before sending to the client. Removes sensitive fields and formats the output.

### Syntax
```typescript
@Serialize(dtoClass: class)
```

### Installation
```bash
npm install class-transformer class-validator
```

### Basic Usage
```typescript
import { Controller, Get, Serialize } from 'clearboot';
import { Exclude, Expose } from 'class-transformer';

// Your domain model (internal)
class User {
    id: number;
    name: string;
    email: string;
    passwordHash: string;  // Never expose this!
    createdAt: Date;
    updatedAt: Date;
}

// Your DTO (what clients see)
class UserDTO {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    email: string;

    @Exclude()  // This won't be sent to client
    passwordHash: string;

    @Exclude()
    createdAt: Date;

    @Exclude()
    updatedAt: Date;
}

@Controller('/users')
class UserController {
    @Get('/:id')
    @Serialize(UserDTO)
    getUser(@Param('id') id: string) {
        // Return full user object
        return {
            id: 1,
            name: 'John Doe',
            email: 'john@example.com',
            passwordHash: 'hashed_password_123',  // This will be excluded
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
}
```

### Response
```json
{
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
}
```
Notice: `passwordHash`, `createdAt`, and `updatedAt` are not included!

### Advanced Transformations
```typescript
import { Type, Transform } from 'class-transformer';

class UserDTO {
    @Expose()
    id: number;

    @Expose()
    @Transform(({ value }) => value.toUpperCase())
    name: string;

    @Expose()
    @Type(() => Date)
    joinedDate: Date;

    @Expose()
    @Transform(({ value }) => value.length > 0 ? value : 'No bio')
    bio: string;

    @Expose()
    @Transform(({ value }) => value ? '$' + value : null)
    salary: number;
}
```

### Nested DTOs
```typescript
class AddressDTO {
    @Expose()
    street: string;

    @Expose()
    city: string;
}

class UserDTO {
    @Expose()
    id: number;

    @Expose()
    name: string;

    @Expose()
    @Type(() => AddressDTO)
    address: AddressDTO;
}

@Controller('/users')
class UserController {
    @Get('/:id')
    @Serialize(UserDTO)
    getUser() {
        return {
            id: 1,
            name: 'John',
            address: {
                street: '123 Main St',
                city: 'New York'
            }
        };
    }
}
```

### Array Serialization
```typescript
@Controller('/users')
class UserController {
    @Get('/')
    @Serialize(UserDTO)
    getUsers() {
        // Returns array - each item will be serialized
        return [
            { id: 1, name: 'John', email: 'john@example.com', passwordHash: '...' },
            { id: 2, name: 'Jane', email: 'jane@example.com', passwordHash: '...' }
        ];
    }
}
```

Response:
```json
[
    { "id": 1, "name": "John", "email": "john@example.com" },
    { "id": 2, "name": "Jane", "email": "jane@example.com" }
]
```

---

## Combining Decorators

```typescript
const CreateUserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(8)
});

@Controller('/users')
class UserController {
    @Post('/')
    @HttpCode(201)
    @Validate(CreateUserSchema)
    @Serialize(UserDTO)
    @Header(ApiHeaderProvider)
    create(@Body() body: any) {
        // 1. @Header injects headers
        // 2. @Validate checks input
        // 3. Handler runs
        // 4. @Serialize transforms output
        // 5. @HttpCode sets status to 201
        return user;
    }
}
```

---

## Best Practices

### ✅ DO:
- ✅ Use `@Validate` for all user inputs
- ✅ Use `@Serialize` to control what clients see
- ✅ Create reusable schemas and DTOs
- ✅ Validate at the route level, not in business logic
- ✅ Use descriptive error messages in schemas

### ❌ DON'T:
- ❌ Skip validation for "trusted" data
- ❌ Return raw internal models to clients
- ❌ Hide errors from clients without logging
- ❌ Put business logic in DTOs

---

## Testing

```typescript
describe('Feature Decorators', () => {
    test('should validate incoming data', async () => {
        const response = await request(server)
            .post('/users')
            .send({ name: 'J', email: 'invalid' })
            .expect(400);

        expect(response.body.error).toBe('Validation Failed');
    });

    test('should serialize response', async () => {
        const response = await request(server)
            .get('/users/1')
            .expect(200);

        expect(response.body.passwordHash).toBeUndefined();
        expect(response.body.id).toBeDefined();
    });
});
```

---

## Troubleshooting

**Issue: Decorator not executing**
- Ensure the method signature is correct
- Check that the class is decorated with `@Controller`
- Verify the route is being matched

**Issue: Validation always passes**
- Ensure Zod schema is correct
- Check the data source (@Body, @Query, etc.)

**Issue: Serialization not working**
- Ensure `@Expose()` is used on DTO fields
- Check that DTO class is imported correctly
- Verify `excludeExtraneousValues: true` is set
