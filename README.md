# 🚀 ClearBoot Framework

> An Atomic, TypeScript-first, Dependency Injection based Web Framework for Node.js.
> *Think NestJS, but lighter and built on native HTTP.*

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

**ClearBoot** est un framework conçu pour apporter de la structure et de la robustesse à vos applications Node.js, sans la complexité excessive des gros frameworks. Il force les bonnes pratiques (Architecture Atomique, DI, Décorateurs) tout en restant performant.

## ✨ Fonctionnalités Clés

- 🏗 **Architecture Atomique** : Structure modulaire et scalable.
- 💉 **Dependency Injection** : Conteneur IoC intégré strict et performant.
- 🎨 **Decorators-First** : `@Controller`, `@Get`, `@Middleware`, `@Validate`...
- 🛡 **Middlewares Robustes** : Système de pipeline complet (Global, Contrôleur, Route).
- 🔒 **Sécurité Intégrée** : Helmet (headers sécurisés), Rate Limiting, CORS, Body Parser sécurisé (limite 1MB).
- ✅ **Validation Intégrée** : Support natif de **Zod** via décorateurs.
- 🔌 **Zéro Dépendance Express** : Construit sur le module `http` natif de Node.js.
- 🧪 **Testable** : Conçu pour le TDD (Unit & Integration ready, 100% coverage).

---

## 📦 Installation

```bash
npm install clearboot reflect-metadata zod
npm install --save-dev typescript @types/node jest

```

## ⚡ Quick Start

### 1. Créez un Service (`src/app/services/user.service.ts`)

```typescript
import { Injectable } from '../../lib';

@Injectable()
export class UserService {
  private users = [{ name: 'Max' }];
  findAll() { return this.users; }
}

```

### 2. Créez un Contrôleur (`src/app/controllers/user.controller.ts`)

```typescript
import { Controller, Get, Post, Body } from '../../lib';
import { UserService } from '../services/user.service';

@Controller('/users')
export class UserController {
    
  private readonly userService = inject(UserService);

  @Get('/')
  getAll() {
    return this.userService.findAll();
  }

  @Post('/')
  create(@Body() body: any) {
    return { created: true, name: body.name };
  }
}

```

### 3. Lancez l'application (`src/app/main.ts`)

```typescript
import { ClearBoot } from '../lib';

ClearBoot.create({ 
  port: 3000,
  logger: { level: 'info' }  // silent | minimal | info | debug
});

```

---

## 📚 Complete Documentation

La documentation complète et détaillée est disponible dans [`docs/`](docs/README.md). **Consultez le fichier [docs/README.md](docs/README.md) pour une navigation complète.**

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

---

## 📄 Licence

Distributed under the MIT License.

---

# 📋 Project Status

## ✅ Completed Phases

### Phase 1: Security & Stability ✅
- ✅ Safe Body Parser with 1MB size limit
- ✅ JSON parsing with error handling
- ✅ Helmet security headers
- ✅ Rate limiting middleware
- ✅ CORS support
- ✅ Request logging

### Phase 2: Lifecycle & Database Integration ✅
- ✅ `onModuleInit()` lifecycle hook
- ✅ Graceful shutdown (SIGTERM, SIGINT)
- ✅ ORM integration examples (TypeORM, Prisma, MongoDB)

### Phase 3: Advanced HTTP Features ✅
- ✅ Cookie support (@Cookie decorator, res.cookie(), res.clearCookie())
- ✅ Form-data parsing (application/x-www-form-urlencoded)
- ✅ File uploads (multipart/form-data with 10MB/file, 50MB total limits)
- ✅ 82 comprehensive tests (all passing)

### Post-Phase 3: Code Quality ✅
- ✅ Comprehensive JSDoc documentation for all core modules
- ✅ Type-safe interfaces and enums
- ✅ Clear parameter and return value documentation
- ✅ Practical usage examples in comments
- ✅ Exception documentation

## 📖 Documentation

Complete code documentation available in [CODE_DOCUMENTATION.md](CODE_DOCUMENTATION.md)
- 22/22 source files documented (100%)
- All functions, classes, and interfaces with JSDoc
- Examples for all major features
- See also the full documentation in [docs/](docs/)

## 🧪 Test Results

```
Test Suites: 20 passed, 20 total
Tests:       82 passed, 82 total
Time:        ~8 seconds
```

All tests verify:
- Route matching and request handling
- Parameter injection (@Body, @Param, @Query, @Cookie)
- Middleware chains and composition
- Input validation with Zod
- Cookie and form-data handling
- File upload with size limits
- CORS and security headers
- Error handling and HTTP exceptions
- Lifecycle hooks and graceful shutdown
