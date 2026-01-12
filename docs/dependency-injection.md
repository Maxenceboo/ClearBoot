
# 💉 Injection de Dépendances (DI)

ClearBoot dispose d'un conteneur IoC (Inversion of Control) intégré. Cela permet de gérer vos services de manière singleton et de les injecter automatiquement dans vos contrôleurs.

## 1. Créer un Service

Utilisez le décorateur `@Injectable()` pour marquer une classe comme gérée par le conteneur.

```typescript
import { Injectable } from '../lib';

@Injectable()
export class UserService {
  private db = ["User 1", "User 2"];

  findAll() {
    return this.db;
  }
}

```

## 2. Injecter un Service

Il suffit de déclarer le service dans le **constructeur** de votre classe (Contrôleur ou autre Service). ClearBoot s'occupe du reste.

```typescript
@Controller('/users')
export class UserController {
  
    private readonly userService = inject(UserService);

  @Get('/')
  getAll() {
    return this.userService.findAll();
  }
}

```

## Règles

* Les services sont des **Singletons** (une seule instance par application).
* L'injection fonctionne dans les contrôleurs, les middlewares et d'autres services.
* Vous ne devez jamais faire `new UserService()` vous-même.
