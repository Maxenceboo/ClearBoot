
# 💉 Injection de Dépendances (DI)

ClearBoot dispose d'un conteneur IoC (Inversion of Control) intégré. Cela permet de gérer vos services de manière singleton et de les injecter automatiquement dans vos contrôleurs.

## 1. Créer un Service

Utilisez le décorateur `@Injectable()` pour marquer une classe comme gérée par le conteneur.

```typescript
import { Injectable } from 'clearboot';

@Injectable()
export class UserService {
  private db = ["User 1", "User 2"];

  findAll() {
    return this.db;
  }
}

```

## 2. Injecter un Service

ClearBoot utilise la fonction `inject()` pour résoudre les dépendances. C'est simple et explicite.

```typescript
import { Controller, Get, inject } from 'clearboot';
import { UserService } from '../services/user.service';

@Controller('/users')
export class UserController {
  
  private readonly userService = inject(UserService);

  @Get('/')
  getAll() {
    return this.userService.findAll();
  }
}

```

### Pourquoi `inject()` plutôt que le constructeur ?

ClearBoot utilise une approche différente de NestJS :
- **Plus simple** : Pas besoin de déclarer les types dans le constructeur
- **Plus explicite** : On voit directement quel service est injecté
- **Moins magique** : Pas de réflexion sur les paramètres du constructeur

```typescript
// ❌ NestJS style (non supporté)
constructor(private userService: UserService) {}

// ✅ ClearBoot style
private readonly userService = inject(UserService);
```

## 3. Injection entre Services

Un service peut également injecter d'autres services.

```typescript
@Injectable()
export class AuthService {
  private readonly userService = inject(UserService);
  
  login(username: string) {
    const users = this.userService.findAll();
    // ...
  }
}
```

## Règles

* Les services sont des **Singletons** (une seule instance par application).
* L'injection fonctionne dans les contrôleurs, les middlewares et d'autres services.
* Vous ne devez jamais faire `new UserService()` vous-même.
* Tous les services doivent avoir le décorateur `@Injectable()`.
