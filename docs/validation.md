
# ✅ Validation des Données

ClearBoot intègre nativement **Zod** pour valider les données entrantes (Body).

## Prérequis

```bash
npm install zod

```

## Utilisation

1. Définissez un schéma Zod.
2. Utilisez le décorateur `@Validate(schema)` sur votre route.
3. Si la validation échoue, une erreur **400 Bad Request** est renvoyée automatiquement.

```typescript
import { z } from 'zod';
import { Controller, Post, Body, Validate } from '../lib';

// 1. Définition du Schéma
const CreateUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  age: z.number().min(18)
});

@Controller('/users')
class UserController {

  @Post('/')
  @Validate(CreateUserSchema) // 👈 2. Validation automatique
  createUser(@Body() body: any) {
    // Si on arrive ici, c'est que 'body' est valide !
    return { status: "User created", data: body };
  }
}

```

## Réponse d'Erreur (Automatique)

Si le client envoie des données invalides, il reçoit :

```json
{
  "status": 400,
  "error": "Validation Failed",
  "details": {
    "username": { "_errors": ["String must contain at least 3 character(s)"] }
  }
}
