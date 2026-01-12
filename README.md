
# 🛡️ ClearBoot Framework

> **The "No-Magic" Backend Framework for TypeScript.**
> Explicit Dependency Injection. Built-in Security. Zero Guesswork.

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-blue.svg)](http://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 🧐 Pourquoi ClearBoot ?

La plupart des frameworks modernes (Spring, NestJS) reposent sur trop de "magie".
* *D'où vient cette variable ?* (Autowiring caché)
* *Pourquoi ma route ne marche pas ?* (Scan de dossiers opaque)

**ClearBoot** prend le contre-pied : **Si ce n'est pas écrit, ça n'existe pas.**

### Les Piliers
1.  **Explicté Totale :** Pas de scan automatique. Vous déclarez vos modules manuellement.
2.  **Injection Fonctionnelle :** Utilisez `inject()` au lieu de surcharger vos constructeurs.
3.  **Sécurité par Design :** Validation, Sérialisation et Headers de sécurité intégrés nativement.

---

## 📦 Installation

```bash
npm install clearboot reflect-metadata zod

```

Assurez-vous d'activer les options suivantes dans votre `tsconfig.json` :

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}

```

---

## 🚀 Quick Start

Voici une API complète en 3 fichiers.

### 1. Créez un Service (`user.service.ts`)

Une simple classe. `@Injectable()` sert de marqueur.

```typescript
import { Injectable } from 'clearboot';

@Injectable()
export class UserService {
  private users = [{ id: 1, name: "Alice" }];

  findAll() {
    return this.users;
  }
}

```

### 2. Créez un Contrôleur (`user.controller.ts`)

Utilisez `inject()` pour récupérer vos dépendances. C'est typé, c'est propre.

```typescript
import { Controller, Get, inject } from 'clearboot';
import { UserService } from './user.service';

@Controller('/users')
export class UserController {
  
  // ✅ Injection explicite et lisible
  readonly userService = inject(UserService);

  @Get('/')
  getAll() {
    return this.userService.findAll();
  }
}

```

### 3. Assemblez l'Application (`main.ts`)

Déclarez explicitement ce que votre application utilise.

```typescript
import { ClearBoot } from 'clearboot';
import { UserService } from './user.service';
import { UserController } from './user.controller';

ClearBoot.create({
  providers: [UserService],      // Services (Singleton)
  controllers: [UserController], // Routes
  port: 3000
});

```

---

## 🔐 Sécurité Avancée (Security Layers)

ClearBoot intègre 4 couches de protection pour vos données.

### 1. Validation des Entrées (`@Validate`)

Refusez les données malformées avant même qu'elles touchent votre code.

```typescript
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

@Post('/')
@Validate(CreateUserSchema) // 🛡️ Bloque si invalide (400 Bad Request)
createUser(body: any) {
  return this.userService.create(body);
}

```

### 2. Sérialisation des Sorties (`@Serialize`)

Ne laissez jamais fuiter un mot de passe. Transformez vos données avant l'envoi.

```typescript
class PublicUserDto {
  @Expose() id: number;
  @Expose() name: string;
  // Pas de password ici !
}

@Get('/:id')
@Serialize(PublicUserDto) // 🛡️ Nettoie le JSON de réponse
getUser() {
  return this.userService.findOne();
}

```

### 3. Gardes (`@Guard`)

Protégez vos routes administratives.

```typescript
@Get('/admin')
@Guard(AdminGuard) // 🛡️ Bloque si pas admin (403 Forbidden)
getSensitiveData() {
  return "Top Secret";
}

```

---

## 📚 Architecture

Comment ClearBoot démarre votre application :

1. **Registry Phase :** Lit la configuration `ClearBoot.create()`.
2. **Provider Phase :** Instancie tous les Services et les stocke dans le Conteneur Global.
3. **Controller Phase :** Instancie les Contrôleurs. La fonction `inject()` puise alors dans le Conteneur déjà rempli.
4. **Routing Phase :** Mappe les routes `@Get/@Post` et lance le serveur HTTP sécurisé (Helmet headers inclus).

---

## 🤝 Contribuer

Projet Open Source créé pour l'apprentissage et la maîtrise de l'architecture backend.
Les Pull Requests sont les bienvenues pour ajouter :

* Support des WebSockets.
* Intégration ORM (TypeORM/Prisma).

---

**Happy Coding with ClearBoot!** 🚀