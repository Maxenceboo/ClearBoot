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

ClearBoot.create({ port: 3000 });

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
- 💉 **[Dependency Injection](docs/dependency-injection-advanced.md)** - Services et patterns
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

Distribué sous la licence MIT.


.

.

.

# 📝 Roadmap ClearBoot v2

## ✅ Phase 1 : Sécurité & Stabilité (TERMINÉE)

*L'objectif est de boucher les trous de sécurité avant d'ajouter des fonctionnalités.*

* [x] **Sécuriser le Body Parser** : Limite de taille (1MB) pour éviter les attaques DoS.
* [x] **Gestion Safe du JSON** : Le serveur ne crash plus sur du JSON mal formé (try-catch intégré).
* [x] **Headers de Sécurité** : Middleware Helmet complet (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, etc.).
* [x] **Rate Limiting** : Middleware anti-spam pour limiter les requêtes.
* [x] **CORS** : Support de la configuration CORS intégrée.
* [x] **Logger** : Middleware de logging des requêtes.

## 🏗️ Phase 2 : Cycle de Vie & Base de Données (TERMINÉE ✅)

*L'objectif est de gérer proprement les connexions externes (DB).*

* [x] **Lifecycle Hooks** : Ajouter une méthode `onModuleInit()` dans `ClearBoot.create()` pour se connecter à la DB *avant* d'écouter le port.
* [x] **Graceful Shutdown** : Gérer les signaux `SIGTERM` et `SIGINT` (Ctrl+C) pour fermer la connexion DB et le serveur proprement.
* [x] **Intégration ORM** : Exemples avec **TypeORM**, **Prisma**, et **MongoDB** native driver.

## 📦 Phase 3 : Fonctionnalités HTTP Avancées (TERMINÉE ✅)

*L'objectif est de supporter autre chose que du simple JSON.*

* [x] **Support Cookies** : Parser pour lire (`@Cookie()`) et écrire (`res.cookie()`) des cookies (indispensable pour l'auth).
* [x] **Support Form-Data** : Gérer le format `application/x-www-form-urlencoded` (formulaires HTML classiques).
* [x] **Upload de Fichiers** : Gérer le format `multipart/form-data` pour permettre l'upload d'images/fichiers.

## 🚀 Phase 4 : Optimisations (Bonus)

*Pour quand le framework sera sous forte charge.*

* [ ] **Optimisation du Routing** : Remplacer la boucle `for` actuelle par une structure en arbre (Radix Tree) ou une Map pour accélérer la recherche de routes.
* [ ] **Request Scoping** : (Très avancé) Permettre l'injection de services liés à la requête (et non Singleton) pour stocker l'utilisateur connecté sans risque de fuite de données entre utilisateurs.
