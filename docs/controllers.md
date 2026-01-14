# 🎮 Contrôleurs

Les contrôleurs sont responsables de la gestion des requêtes entrantes et de renvoyer les réponses au client.

## Exemple Basique

```typescript
@Controller("/cats")
export class CatsController {
  @Get()
  findAll() {
    return "This action returns all cats";
  }
}
```

## Décorateurs de Méthode

ClearBoot supporte les verbes HTTP standards :

- `@Get(path?)`
- `@Post(path?)`
- `@Put(path?)`
- `@Delete(path?)`
- `@Patch(path?)`

## Extraction de Paramètres

Vous pouvez accéder aux détails de la requête via des décorateurs :

| Décorateur     | Description                            |
| -------------- | -------------------------------------- |
| `@Body()`      | Le corps de la requête (JSON parsé)    |
| `@Query(key?)` | Les paramètres d'URL (`?id=1`)         |
| `@Param(key?)` | Les paramètres de route (`/users/:id`) |
| `@Req()`       | L'objet `IncomingMessage` natif        |
| `@Res()`       | L'objet `ClearResponse` amélioré       |

```typescript
@Post('/create')
create(@Body() createDto: any) {
  return 'This action adds a new cat';
}

@Get(':id')
findOne(@Param('id') id: string) {
  return `This action returns a #${id} cat`;
}

```
