
# 🛡 Middlewares

Les Middlewares dans **ClearBoot** sont des classes qui s'interposent avant l'exécution de vos contrôleurs. Ils sont idéaux pour le logging, l'authentification, la gestion CORS, etc.

## Créer un Middleware

Un middleware est une classe décorée par `@Injectable` qui implémente l'interface `IMiddleware`.

```typescript
import { Injectable, IMiddleware, ClearResponse } from '../lib';
import * as http from 'http';

@Injectable()
export class AuthMiddleware implements IMiddleware {
  use(req: http.IncomingMessage, res: ClearResponse, next: () => void) {
    
    // Vérification
    if (req.headers.authorization === 'secret') {
      next(); // ✅ On passe à la suite
    } else {
      // ⛔ On bloque avec la syntaxe fluide
      res.status(401).json({ error: "Non autorisé" });
    }
  }
}

```

## Appliquer un Middleware

### 1. Portée Globale (Global Scope)

S'applique à **toutes** les routes de l'application.

```typescript
ClearBoot.create({
  port: 3000,
  globalMiddlewares: [LoggerMiddleware]
});

```

### 2. Portée Contrôleur (Controller Scope)

S'applique à toutes les routes d'un contrôleur spécifique.

```typescript
@Controller('/admin')
@Middleware(AuthMiddleware) // 🔒 Tout ce contrôleur est protégé
class AdminController { ... }

```

### 3. Portée Route (Route Scope)

S'applique uniquement à une méthode spécifique.

```typescript
@Controller('/users')
class UserController {

  @Get('/public')
  publicData() { ... }

  @Get('/private')
  @Middleware(AuthMiddleware) // 🔒 Juste cette route
  privateData() { ... }
}

```