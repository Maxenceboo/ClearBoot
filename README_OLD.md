# 🚀 ClearBoot

[![npm version](https://img.shields.io/npm/v/clearboot.svg)](https://www.npmjs.com/package/clearboot)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/Maxenceboo/clearboot)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Maxenceboo/clearboot)

**A TypeScript-first, Dependency Injection based Web Framework for Node.js**

*Think NestJS, but lighter and built on native HTTP—no Express overhead.*

ClearBoot brings structure and robustness to your Node.js applications without the complexity of heavier frameworks. It enforces best practices (DI, Decorators, Atomic Architecture) while staying lightweight and performant.

## ✨ Why ClearBoot?

- 🏗️ **Atomic Architecture** - Modular, scalable structure that grows with your project
- 💉 **Built-in Dependency Injection** - Strict IoC container for clean, testable code
- 🎨 **Decorator-First API** - Familiar syntax: `@Controller`, `@Get`, `@Validate`, `@Middleware`
- 🛡️ **Production-Ready Middleware** - Complete pipeline system (global, controller, route-level)
- 🔒 **Security by Default** - Helmet headers, rate limiting, CORS, secure body parsing (1MB limit)
- ✅ **Type-Safe Validation** - Native Zod integration via decorators
- ⚡ **Zero HTTP Dependencies** - Built on Node.js native `http` module for maximum performance
- 🧪 **Test-Driven Design** - 120 tests, 100% coverage, ready for TDD/BDD
- 📝 **Full TypeScript Support** - Complete type safety from request to response

---

## 📦 Installation

```bash
npm install clearboot reflect-metadata zod
npm install --save-dev typescript @types/node jest

```

## 🚀 Quick Start

### Installation

```bash
npm install clearboot reflect-metadata zod
```

### Create Your First API

**1. Define a Service** (`user.service.ts`)

```typescript
import { Injectable } from 'clearboot';

@Injectable()
export class UserService {
  private users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
  
  findAll() {
    return this.users;
  }
  
  findById(id: number) {
    return this.users.find(u => u.id === id);
  }
}
```

**2. Create a Controller** (`user.controller.ts`)

```typescript
import { Controller, Get, Post, Body, Param, inject } from 'clearboot';
import { UserService } from './user.service';

@Controller('/users')
export class UserController {
  private readonly userService = inject(UserService);

  @Get('/')
  getAllUsers() {
    return this.userService.findAll();
  }

  @Get('/:id')
  getUserById(@Param('id') id: string) {
    return this.userService.findById(Number(id));
  }

  @Post('/')
  createUser(@Body() body: { name: string }) {
    return { created: true, user: body };
  }
}
```

**3. Bootstrap Your Application** (`main.ts`)

```typescript
import 'reflect-metadata';
import { ClearBoot } from 'clearboot';

await ClearBoot.create({ 
  port: 3000,
  logger: { level: 'info' }  // silent | minimal | info | debug
});

console.log('🚀 Server running on http://localhost:3000');
```

**That's it!** Your API is now running with:
- ✅ Dependency injection
- ✅ Request logging
- ✅ Type-safe routing
- ✅ Graceful shutdown

Test it:
```bash
curl http://localhost:3000/users
curl http://localhost:3000/users/1
```

---

## 📚 Documentation

### Core Guides
- 🚀 [**Getting Started**](docs/getting-started.md) - Setup and first steps
- 🛣️ [**Controllers**](docs/controllers-guide.md) - Routing, HTTP verbs, parameters  
- 📝 [**HTTP Features**](docs/http-features.md) - Cookies, file uploads, form-data
- ✅ [**Validation**](docs/feature-decorators.md) - Type-safe validation with Zod
- 💉 [**Dependency Injection**](docs/dependency-injection-advanced.md) - Service patterns
- 🔧 [**Middleware**](docs/middlewares.md) - Request/response processing

### Advanced Topics
- 📊 [**Logging**](docs/logging.md) - Structured logging system
- 🏗️ [**Architecture Patterns**](docs/patterns.md) - MVC, Repository, Service Layer
- 🔄 [**Lifecycle Hooks**](docs/lifecycle.md) - Startup, shutdown, database integration
- 🧪 [**Testing**](docs/testing.md) - Unit and integration testing
- 📖 [**API Reference**](docs/api-reference.md) - Complete decorator reference
- ⚙️ [**Configuration**](docs/configuration.md) - Environment and app config

**👉 [Full Documentation Index](docs/README.md)**

---

### Quick Navigation
- 🚀 **[Getting Started](docs/getting-started.md)** - Démarrage rapide et premiers pas
- 🛣️ **[Controllers Guide](docs/controllers-guide.md)** - Routes, paramètres, HTTP verbs
- 📝 **[HTTP Responses](docs/http-response.md)** - Status codes, headers, serialization
- � **[HTTP Features](docs/http-features.md)** - Cookies, Form-Data, File Upload
- �🎯 **[Feature Decorators](docs/feature-decorators.md)** - @Validate, @Serialize
- � **[Logging](docs/logging.md)** - Log levels, HTTP requests, errors, configuration
- �💉 **[Dependency Injection](docs/dependency-injection-advanced.md)** - Services et patterns
- 🏗️ **[Architectural Patterns](docs/patterns.md)** - MVC, Service Layer, Repository Pattern
- 🔄 **[Lifecycle & Database](docs/lifecycle.md)** - onModuleInit, Graceful Shutdown, ORM Integration
- 🧪 **[Testing Guide](docs/testing.md)** - Unit & Integration tests
- 📖 **[API Reference](docs/api-reference.md)** - Complete decorator & API reference

### Other Resources
1. **[Contrôleurs & Routing](docs/controllers-guide.md)**
2. **[Middlewares & Sécurité](docs/middlewares.md)**
3. **[Injection de Dépendances (DI)](docs/dependency-injection-advanced.md)**
4. **[Validation avec Zod](docs/feature-decorators.md)**
5. **[Architecture](docs/architecture.md)**
6. **[Configuration](docs/configuration.md)**
7. **[Exception Handling](docs/exceptions.md)**

## 🏆 Features

### HTTP & Routing
- ✅ Decorator-based routing (`@Get`, `@Post`, `@Put`, `@Delete`, `@Patch`)
- ✅ Parameter extraction (`@Body`, `@Param`, `@Query`, `@Cookie`, `@Headers`)
- ✅ File uploads (multipart/form-data, 10MB per file)
- ✅ Form-data parsing (application/x-www-form-urlencoded)
- ✅ Cookie management (`@Cookie`, `res.cookie()`, `res.clearCookie()`)
- ✅ Custom HTTP codes and headers

### Middleware & Security
- ✅ Three-level middleware pipeline (global, controller, route)
- ✅ Security headers (Helmet integration)
- ✅ Rate limiting
- ✅ CORS support
- ✅ Body size limits (1MB default)
- ✅ Request logging with configurable levels

### Validation & Serialization
- ✅ Type-safe validation with Zod (`@Validate` decorator)
- ✅ Automatic response serialization (`@Serialize`)
- ✅ Class-transformer integration

### Architecture
- ✅ Dependency injection container
- ✅ Lifecycle hooks (`onModuleInit`)
- ✅ Graceful shutdown (SIGTERM, SIGINT)
- ✅ ORM integration support (TypeORM, Prisma, MongoDB)
- ✅ 100% TypeScript with full type inference

### Quality
- ✅ **120 tests** with 100% coverage
- ✅ Complete JSDoc documentation
- ✅ Production-ready error handling
- ✅ Zero Express dependencies

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the TypeScript community**
