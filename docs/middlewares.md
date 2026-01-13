
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

## Middlewares Intégrés

ClearBoot fournit des middlewares prêts à l'emploi pour les besoins courants :

### HelmetMiddleware 🛡️

Ajoute des headers de sécurité HTTP (protection XSS, clickjacking, etc.).

```typescript
import { HelmetMiddleware } from 'clearboot';

ClearBoot.create({
  globalMiddlewares: [HelmetMiddleware]
});
```

**Headers ajoutés :**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `X-DNS-Prefetch-Control: off`
- `X-Download-Options: noopen`

### LoggerMiddleware 📝

Logue toutes les requêtes avec la méthode, l'URL, le status et la durée.

```typescript
import { LoggerMiddleware } from 'clearboot';

ClearBoot.create({
  globalMiddlewares: [LoggerMiddleware]
});

// Sortie : 📝 [GET] /users - 200 (45ms)
```

### RateLimitMiddleware ⏱️

Limite le nombre de requêtes par IP (100 req/15min par défaut).

```typescript
import { RateLimitMiddleware } from 'clearboot';

ClearBoot.create({
  globalMiddlewares: [RateLimitMiddleware]
});

// Si dépassement : 429 Too Many Requests
```

**Headers ajoutés :**
- `X-RateLimit-Limit: 100`
- `X-RateLimit-Remaining: 95`

---

## Appliquer un Middleware

### 1. Portée Globale (Global Scope)

S'applique à **toutes** les routes de l'application.

```typescript
import { HelmetMiddleware, LoggerMiddleware, RateLimitMiddleware } from 'clearboot';

ClearBoot.create({
  port: 3000,
  globalMiddlewares: [
    HelmetMiddleware,
    LoggerMiddleware,
    RateLimitMiddleware
  ]
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