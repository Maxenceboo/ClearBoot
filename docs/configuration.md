# ⚙️ Configuration & Sécurité

ClearBoot offre une gestion flexible de la configuration via les variables d'environnement (`.env`) et des options de sécurité intégrées comme CORS.

## 1. Variables d'Environnement

ClearBoot intègre `dotenv` automatiquement.

1.  Créez un fichier `.env` à la racine :
    ```env
    PORT=4000
    DATABASE_URL=postgres://user:pass@localhost:5432/db
    API_SECRET=my_super_secret
    ```

2.  Le framework utilisera automatiquement `PORT` si aucun port n'est spécifié dans le code.

## 1.1. Sécurité du Body Parser

ClearBoot protège automatiquement votre application contre les attaques DoS :

- **Limite de taille** : 1MB par défaut pour les requêtes JSON
- **Protection JSON** : Gestion automatique des JSON malformés (pas de crash)
- **Erreurs explicites** : `PayloadTooLargeException` (413) ou `BadRequestException` (400)

```typescript
// Si un client envoie plus de 1MB :
// ⛔ 413 Payload Too Large

// Si un client envoie du JSON invalide :
// ⛔ 400 Bad Request - Invalid JSON format
```

## 2. Options de Démarrage

Voici toutes les options disponibles lors de la création de l'application :

```typescript
ClearBoot.create({
  port: 3000,                  // Optionnel (défaut: process.env.PORT ou 3000)
  globalMiddlewares: [],       // Liste des middlewares globaux
  cors: { ... }                // Configuration CORS (voir ci-dessous)
});

```

## 3. Configuration CORS (Cross-Origin Resource Sharing)

Par défaut, l'API est accessible de partout (`*`). Pour la production, il est crucial de restreindre l'accès.

### Exemple Sécurisé

```typescript
ClearBoot.create({
  cors: {
    // 🔒 Autoriser uniquement votre Frontend
    origin: ['[https://mon-app.com](https://mon-app.com)', 'http://localhost:3000'],
    
    // 🍪 Autoriser les cookies / headers d'auth
    credentials: true,
    
    // Methods autorisées
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    
    // Headers autorisés
    allowedHeaders: ['Content-Type', 'Authorization']
  }
});

```

### Options CORS

| Option | Type | Description |
| --- | --- | --- |
| `origin` | `string` | `string[]` |
| `methods` | `string[]` | Liste des verbes HTTP autorisés. |
| `credentials` | `boolean` | Si `true`, autorise l'envoi de cookies. |
| `maxAge` | `number` | Durée du cache pour la requête `OPTIONS` (en secondes). |

