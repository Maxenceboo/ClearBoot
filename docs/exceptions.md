
# 🚨 Gestion des Erreurs

ClearBoot possède une couche de gestion d'exceptions intégrée. Au lieu de manipuler manuellement les réponses d'erreur, lancez simplement une exception.

## Exceptions Disponibles

| Classe | Status HTTP | Description |
| :--- | :--- | :--- |
| `BadRequestException` | 400 | Données invalides |
| `UnauthorizedException` | 401 | Authentification requise |
| `ForbiddenException` | 403 | Accès interdit |
| `NotFoundException` | 404 | Ressource introuvable |
| `InternalServerErrorException` | 500 | Erreur serveur |

## Utilisation

```typescript
import { Controller, Get, NotFoundException } from '../lib';

@Controller('/items')
class ItemController {
  
  @Get('/:id')
  findOne() {
    const item = findItemInDb();
    
    if (!item) {
      // Le client recevra automatiquement un JSON 404
      throw new NotFoundException("Cet item n'existe pas");
    }
    
    return item;
  }
}

```

## Personnalisation

Vous pouvez créer vos propres exceptions en étendant `HttpException`.

```typescript
export class TeapotException extends HttpException {
  constructor() {
    super("I'm a teapot", 418);
  }
}

```
