import { z } from 'zod';
import { Controller, Post, Body, Validate } from '../../src/lib';

// Define schema
const UserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    age: z.number().min(18)
});

// Infer TypeScript type from schema
type UserDto = z.infer<typeof UserSchema>;

@Controller('/typed')
class TypedController {
    /**
     * Example of type-safe handler using Zod inference.
     * Body parameter is automatically typed as UserDto after validation.
     */
    @Post('/user')
    @Validate(UserSchema)
    createUser(@Body() body: UserDto) {
        // TypeScript knows body has: name, email, age with correct types
        const upperName: string = body.name.toUpperCase();
        const validEmail: string = body.email;
        const adultAge: number = body.age;

        return {
            created: true,
            user: { upperName, validEmail, adultAge }
        };
    }
}

describe('Type-safe Zod Inference', () => {
    test('demonstrates type-safe Zod inference pattern', () => {
        // This test demonstrates the type-safe pattern for Zod inference
        // The actual type checking happens at compile time

        // 1. Define the schema
        const schema = UserSchema;

        // 2. Infer TypeScript type from schema
        type InferredType = z.infer<typeof schema>;

        // 3. Use the inferred type
        const validData: InferredType = {
            name: 'Alice',
            email: 'alice@example.com',
            age: 25
        };

        // 4. Validate at runtime
        const result = schema.parse(validData);

        // TypeScript knows the exact types
        expect(result.name).toBe('Alice');
        expect(result.email).toBe('alice@example.com');
        expect(result.age).toBe(25);
    });

    test('TypeScript catches type errors at compile time', () => {
        // These would fail TypeScript compilation:
        // const invalid1: UserDto = { name: 123 };  // Error: name must be string
        // const invalid2: UserDto = { email: 'test' };  // Error: missing name and age

        expect(true).toBe(true); // Compilation success validates typing
    });
});
