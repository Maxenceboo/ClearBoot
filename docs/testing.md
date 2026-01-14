# Testing Guide

Comprehensive guide to testing ClearBoot applications with Jest and Supertest.

---

## Table of Contents

1. [Unit Testing](#unit-testing)
2. [Integration Testing](#integration-testing)
3. [Middleware Testing](#middleware-testing)
4. [Mocking & Fixtures](#mocking--fixtures)
5. [Test Patterns](#test-patterns)
6. [Coverage](#coverage)

---

## Unit Testing

Unit tests verify individual functions and classes in isolation.

### Basic Unit Test

```typescript
describe("UserService", () => {
  let userService: UserService;
  let mockRepository: Partial<UserRepository>;

  beforeEach(() => {
    // Create mocks
    mockRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 1,
        name: "John",
        email: "john@example.com",
      }),
    };

    // Inject mocks
    userService = new UserService(mockRepository as UserRepository);
  });

  test("should find user by id", async () => {
    const user = await userService.getUser(1);

    expect(user.id).toBe(1);
    expect(user.name).toBe("John");
    expect(mockRepository.findById).toHaveBeenCalledWith(1);
  });

  test("should throw error when user not found", async () => {
    (mockRepository.findById as jest.Mock).mockResolvedValueOnce(null);

    await expect(userService.getUser(1)).rejects.toThrow("User not found");
  });
});
```

### Testing Services

```typescript
describe("EmailService", () => {
  let emailService: EmailService;
  let mockSmtpClient: any;

  beforeEach(() => {
    mockSmtpClient = {
      send: jest.fn().mockResolvedValue({ success: true }),
    };

    emailService = new EmailService(mockSmtpClient);
  });

  test("should send email", async () => {
    await emailService.send("user@example.com", "Hello", "Test message");

    expect(mockSmtpClient.send).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "Hello",
      body: "Test message",
    });
  });

  test("should handle sending errors", async () => {
    mockSmtpClient.send.mockRejectedValueOnce(new Error("SMTP failed"));

    await expect(
      emailService.send("user@example.com", "Hello", "Test"),
    ).rejects.toThrow("SMTP failed");
  });
});
```

### Testing Utility Functions

```typescript
describe("String Utilities", () => {
  test("should capitalize string", () => {
    expect(capitalize("hello")).toBe("Hello");
    expect(capitalize("HELLO")).toBe("Hello");
  });

  test("should truncate long strings", () => {
    const result = truncate("This is a very long string", 10);
    expect(result).toBe("This is...");
    expect(result.length).toBeLessThanOrEqual(13);
  });

  test("should slugify strings", () => {
    expect(slugify("Hello World")).toBe("hello-world");
    expect(slugify("Test-String_123")).toBe("test-string-123");
  });
});
```

---

## Integration Testing

Integration tests verify how components work together.

### HTTP Endpoint Testing

```typescript
import request from "supertest";

describe("User API", () => {
  let server: any;

  beforeEach(() => {
    const app = ClearBoot.create();
    server = app.getServer();
  });

  test("should create user", async () => {
    const response = await request(server)
      .post("/users")
      .send({
        name: "John Doe",
        email: "john@example.com",
        password: "securepass123",
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe("John Doe");
    expect(response.body.passwordHash).toBeUndefined(); // DTO excluded it
  });

  test("should validate email format", async () => {
    const response = await request(server)
      .post("/users")
      .send({
        name: "John",
        email: "invalid-email",
        password: "securepass123",
      })
      .expect(400);

    expect(response.body.error).toBe("Validation Failed");
    expect(response.body.details.email).toBeDefined();
  });

  test("should get user by id", async () => {
    const response = await request(server).get("/users/1").expect(200);

    expect(response.body.id).toBe(1);
    expect(response.body.name).toBeDefined();
  });

  test("should return 404 for non-existent user", async () => {
    const response = await request(server).get("/users/99999").expect(404);

    expect(response.body.error).toContain("not found");
  });
});
```

### Testing Query Parameters

```typescript
describe("Search API", () => {
  let server: any;

  beforeEach(() => {
    const app = ClearBoot.create();
    server = app.getServer();
  });

  test("should search with query parameters", async () => {
    const response = await request(server)
      .get("/search")
      .query({ q: "javascript", limit: 10, offset: 0 })
      .expect(200);

    expect(response.body.results).toBeInstanceOf(Array);
    expect(response.body.total).toBeGreaterThanOrEqual(0);
  });

  test("should handle missing required parameters", async () => {
    const response = await request(server)
      .get("/search")
      .query({ limit: 10 })
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  test("should apply default values", async () => {
    const response = await request(server)
      .get("/search")
      .query({ q: "javascript" })
      .expect(200);

    // Check that defaults were applied
    expect(response.body.limit).toBe(20); // default
    expect(response.body.offset).toBe(0); // default
  });
});
```

### Testing Request/Response Transformation

```typescript
describe("Serialization", () => {
  let server: any;

  beforeEach(() => {
    const app = ClearBoot.create();
    server = app.getServer();
  });

  test("should exclude sensitive fields", async () => {
    const response = await request(server).get("/users/1").expect(200);

    expect(response.body).toEqual({
      id: expect.any(Number),
      name: expect.any(String),
      email: expect.any(String),
    });

    expect(response.body.passwordHash).toBeUndefined();
    expect(response.body.createdAt).toBeUndefined();
  });

  test("should serialize arrays", async () => {
    const response = await request(server).get("/users").expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    response.body.forEach((user) => {
      expect(user.passwordHash).toBeUndefined();
    });
  });
});
```

---

## Middleware Testing

Testing middleware functionality and ordering.

### Testing Middleware Execution

```typescript
describe("AuthMiddleware", () => {
  test("should pass with valid token", async () => {
    const mockReq = {
      headers: {
        authorization: "Bearer valid.token.here",
      },
    };

    const mockRes = {};
    const mockNext = jest.fn();

    const middleware = new AuthMiddleware(mockAuthService);
    await middleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toBeDefined();
  });

  test("should reject invalid token", async () => {
    const mockReq = {
      headers: {
        authorization: "Bearer invalid",
      },
    };

    const mockRes = {
      writeHead: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };

    const mockNext = jest.fn();

    const middleware = new AuthMiddleware(mockAuthService);
    await middleware.use(mockReq, mockRes, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.writeHead).toHaveBeenCalledWith(401);
  });
});
```

### Testing Middleware Chain

```typescript
describe("Middleware Chain", () => {
  let server: any;

  beforeEach(async () => {
    const app = ClearBoot.create({
      globalMiddlewares: [
        AuthMiddleware,
        LoggerMiddleware,
        RateLimitMiddleware,
      ],
    });
    server = app.getServer();
  });

  test("should execute middlewares in order", async () => {
    const spy = jest.fn();

    // Patch middlewares to track calls
    const originalAuth = AuthMiddleware.prototype.use;
    AuthMiddleware.prototype.use = async function (req, res, next) {
      spy("auth-before");
      await originalAuth.call(this, req, res, next);
      spy("auth-after");
    };

    await request(server)
      .get("/protected")
      .set("Authorization", "Bearer token")
      .expect(200);

    expect(spy).toHaveBeenCalledWith("auth-before");
    expect(spy).toHaveBeenCalledWith("auth-after");
  });
});
```

---

## Mocking & Fixtures

### Creating Mocks

```typescript
// mocks/user.repository.mock.ts
export const createMockUserRepository = (): Partial<UserRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

// mocks/email.service.mock.ts
export const createMockEmailService = (): Partial<EmailService> => ({
  send: jest.fn().mockResolvedValue({ success: true }),
  sendBulk: jest.fn().mockResolvedValue({ sent: 0, failed: 0 }),
});
```

### Using Fixtures

```typescript
// fixtures/users.fixture.ts
export const userFixtures = {
  john: {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    passwordHash: "hashed_password",
    role: "user",
    createdAt: new Date("2024-01-01"),
  },

  admin: {
    id: 2,
    name: "Admin User",
    email: "admin@example.com",
    passwordHash: "hashed_password",
    role: "admin",
    createdAt: new Date("2024-01-01"),
  },
};

// Using fixtures in tests
describe("UserService", () => {
  test("should find user", async () => {
    const mockRepo = {
      findById: jest.fn().mockResolvedValue(userFixtures.john),
    };

    const service = new UserService(mockRepo as any);
    const user = await service.getUser(1);

    expect(user.name).toBe("John Doe");
  });
});
```

---

## Test Patterns

### Arrange-Act-Assert Pattern

```typescript
test("should calculate discount correctly", () => {
  // Arrange
  const price = 100;
  const discountPercent = 20;

  // Act
  const result = calculateDiscount(price, discountPercent);

  // Assert
  expect(result).toBe(80);
});
```

### Testing Error Cases

```typescript
describe("Error Handling", () => {
  test("should throw validation error", () => {
    expect(() => {
      validateEmail("invalid-email");
    }).toThrow("Invalid email format");
  });

  test("should reject promise with error", async () => {
    const promise = getUserAsync(99999);

    await expect(promise).rejects.toThrow("User not found");
  });

  test("should handle async errors", async () => {
    const promise = fetchUserData(99999);

    try {
      await promise;
      fail("Should have thrown");
    } catch (error) {
      expect(error.statusCode).toBe(404);
    }
  });
});
```

### Testing State Changes

```typescript
describe("Cache Service", () => {
  test("should store and retrieve values", () => {
    const cache = new CacheService();

    // Initial state
    expect(cache.get("key1")).toBeUndefined();

    // Act
    cache.set("key1", "value1");

    // Verify state changed
    expect(cache.get("key1")).toBe("value1");
  });

  test("should clear cache", () => {
    const cache = new CacheService();
    cache.set("key1", "value1");
    cache.set("key2", "value2");

    cache.clear();

    expect(cache.get("key1")).toBeUndefined();
    expect(cache.get("key2")).toBeUndefined();
  });
});
```

### Parameterized Tests

```typescript
describe("Email Validation", () => {
  const validEmails = [
    "user@example.com",
    "john.doe@example.co.uk",
    "test+tag@example.com",
  ];

  const invalidEmails = [
    "notanemail",
    "@example.com",
    "user@",
    "user name@example.com",
  ];

  test.each(validEmails)("should accept %s", (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  test.each(invalidEmails)("should reject %s", (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});
```

---

## Coverage

### Checking Coverage

```bash
npm test -- --coverage
```

### Coverage Report

```
File                          | % Stmts | % Branch | % Funcs | % Lines
------------------------------|---------|----------|---------|----------
All files                     |   92.5  |   88.3   |   91.2  |   92.1
 src/lib/core                 |   96.8  |   95.2   |   98.0  |   96.8
 src/lib/decorators           |   87.5  |   82.1   |   90.0  |   87.5
 src/lib/di                   |   90.0  |   88.5   |   92.0  |   90.0
 src/lib/http                 |   95.0  |   92.3   |   96.0  |   95.0
 src/lib/middlewares          |   94.4  |   91.2   |   95.0  |   94.4
 src/lib/router               |   100   |   100    |   100   |   100
```

### Improving Coverage

```typescript
// Find untested code
// Look for branches with 0% coverage

// Example: Test error paths
describe("Database", () => {
  test("should handle connection errors", async () => {
    // This path may not be covered
    const db = new Database("invalid://url");

    await expect(db.connect()).rejects.toThrow();
  });
});
```

### Coverage Thresholds

```json
// jest.config.js
{
  "coverageThresholds": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

---

## Best Practices

### ✅ DO:

- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Keep tests focused (one assertion per test if possible)
- ✅ Mock external dependencies
- ✅ Use fixtures for common test data
- ✅ Test error cases and edge cases
- ✅ Keep tests DRY with beforeEach
- ✅ Use meaningful assertions

### ❌ DON'T:

- ❌ Test implementation details
- ❌ Have tests depend on each other
- ❌ Use random data (use fixtures)
- ❌ Test multiple things in one test
- ❌ Ignore failing tests
- ❌ Have tests that are sometimes green, sometimes red
- ❌ Make API calls in unit tests
- ❌ Use real databases in unit tests

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- user.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create"

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Run single test
npm test -- --testNamePattern="should validate email"
```

---

## Example: Complete Test Suite

```typescript
describe("UserController", () => {
  let server: any;
  let mockUserService: Partial<UserService>;

  beforeEach(async () => {
    mockUserService = {
      register: jest.fn(),
      getUser: jest.fn(),
    };

    globalContainer.register(UserService, () => mockUserService as any);

    const app = ClearBoot.create();
    server = app.getServer();
  });

  describe("POST /users/register", () => {
    test("should create user with valid data", async () => {
      const userData = {
        name: "John",
        email: "john@example.com",
        password: "password123",
      };

      (mockUserService.register as jest.Mock).mockResolvedValue({
        id: 1,
        ...userData,
        passwordHash: "...",
      });

      const response = await request(server)
        .post("/users/register")
        .send(userData)
        .expect(201);

      expect(response.body.id).toBe(1);
      expect(response.body.passwordHash).toBeUndefined();
    });

    test("should reject invalid email", async () => {
      const response = await request(server)
        .post("/users/register")
        .send({
          name: "John",
          email: "invalid",
          password: "password123",
        })
        .expect(400);

      expect(response.body.error).toBe("Validation Failed");
    });
  });

  describe("GET /users/:id", () => {
    test("should get user by id", async () => {
      (mockUserService.getUser as jest.Mock).mockResolvedValue(
        userFixtures.john,
      );

      const response = await request(server).get("/users/1").expect(200);

      expect(response.body.name).toBe("John Doe");
    });

    test("should return 404 for non-existent user", async () => {
      (mockUserService.getUser as jest.Mock).mockRejectedValue(
        new NotFoundError("User"),
      );

      const response = await request(server).get("/users/99999").expect(404);

      expect(response.body.error).toContain("not found");
    });
  });
});
```
