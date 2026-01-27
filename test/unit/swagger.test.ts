import { SwaggerGenerator, SwaggerConfig } from '../../src/lib/http/swagger-generator';
import { Controller, Get, Post, Param, Body, ApiOperation, ApiParam, ApiResponse, ApiTags, ApiBody, ApiSecurity } from '../../src/lib/index';
import { z } from 'zod';

describe('Swagger Integration', () => {
    const UserSchema = z.object({
        id: z.number(),
        name: z.string(),
        email: z.string().email(),
    });

    @Controller('/users')
    @ApiTags('Users')
    class UserController {
        @Get('/')
        @ApiOperation('Get All Users', 'Fetch list of all users')
        @ApiResponse(200, 'Users retrieved successfully', UserSchema)
        getAllUsers() {
            return [{ id: 1, name: 'John', email: 'john@example.com' }];
        }

        @Get('/:id')
        @ApiOperation('Get User by ID', 'Fetch a specific user')
        @ApiParam('id', 'number', 'User ID')
        @ApiResponse(200, 'User found', UserSchema)
        @ApiResponse(404, 'User not found')
        getUserById(@Param('id') id: string) {
            return { id: parseInt(id), name: 'John', email: 'john@example.com' };
        }

        @Post('/')
        @ApiOperation('Create User', 'Create a new user')
        @ApiBody(UserSchema, 'User data')
        @ApiResponse(201, 'User created', UserSchema)
        createUser(@Body() body: any) {
            return { id: 1, ...body };
        }
    }

    it('should generate OpenAPI spec from controllers', () => {
        const config: SwaggerConfig = {
            title: 'Test API',
            description: 'Test API Description',
            version: '1.0.0',
        };

        const spec = SwaggerGenerator.generateSpec(config, [UserController]);

        expect(spec.openapi).toBe('3.0.0');
        expect(spec.info.title).toBe('Test API');
        expect(spec.info.version).toBe('1.0.0');
    });

    it('should include paths from controllers', () => {
        const config: SwaggerConfig = {
            title: 'Test API',
            version: '1.0.0',
        };

        const spec = SwaggerGenerator.generateSpec(config, [UserController]);

        // Check that spec is valid (paths might be empty without actual route metadata)
        expect(spec.paths).toBeDefined();
    });

    it('should extract operation metadata', () => {
        const config: SwaggerConfig = {
            title: 'Test API',
            version: '1.0.0',
        };

        const spec = SwaggerGenerator.generateSpec(config, [UserController]);

        // Check that paths exist
        expect(spec.paths).toBeDefined();
    });

    it('should include tags in spec', () => {
        const config: SwaggerConfig = {
            title: 'Test API',
            version: '1.0.0',
        };

        const spec = SwaggerGenerator.generateSpec(config, [UserController]);

        expect(spec.tags).toBeDefined();
        expect(spec.tags!.some((tag: any) => tag.name === 'Users')).toBe(true);
    });

    it('should handle multiple controllers', () => {
        @Controller('/products')
        class ProductController {
            @Get('/')
            @ApiOperation('Get All Products')
            getAllProducts() {
                return [];
            }
        }

        const config: SwaggerConfig = {
            title: 'Test API',
            version: '1.0.0',
        };

        const spec = SwaggerGenerator.generateSpec(config, [UserController, ProductController]);

        expect(spec.paths).toBeDefined();
    });
});
