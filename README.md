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
- ✅ **Validation Intégrée** : Support natif de **Zod** via décorateurs.
- 🔌 **Zéro Dépendance Express** : Construit sur le module `http` natif de Node.js.
- 🧪 **Testable** : Conçu pour le TDD (Unit & Integration ready).

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

ClearBoot.create({ port: 3000 });

```

---

## 📚 Documentation

La documentation complète est disponible dans le dossier [`docs/`](https://www.google.com/search?q=./docs).

1. **[Contrôleurs & Routing](docs/controllers.md)**
2. **[Middlewares & Sécurité](docs/middlewares.md)**
3. **[Injection de Dépendances (DI)](docs/dependency-injection.md)**
4. **[Validation avec Zod](docs/validation.md)**
5. **[Architecture](docs/architecture.md)**

---

## 📄 Licence

Distribué sous la licence MIT.
