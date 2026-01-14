# 🏗 Architecture ClearBoot

ClearBoot suit une architecture modulaire et stratifiée.

## Le Cycle de Vie d'une Requête

1.  **Incoming Request** : La requête HTTP native arrive.
2.  **Global Middlewares** : Traitement global (Logs, CORS...).
3.  **Router** : ClearBoot trouve le bon Contrôleur et la bonne Méthode.
4.  **Controller Middlewares** : Sécurité spécifique au module.
5.  **Route Middlewares** : Sécurité spécifique à la route.
6.  **Validation Pipe** : Vérification des données (Zod).
7.  **Controller Handler** : Votre code métier s'exécute.
8.  **Response** : Le résultat est transformé en JSON et envoyé.

## Structure de Dossiers Recommandée

```text
src/
├── app/                  # Votre Application
│   ├── controllers/      # Routes et points d'entrée
│   ├── services/         # Logique métier
│   ├── middlewares/      # Intercepteurs
│   └── main.ts           # Point d'entrée
│
└── lib/                  # Le Framework ClearBoot (Core)
    ├── common/           # Interfaces et Types
    ├── core/             # Logique interne (Server, Scanner)
    ├── decorators/       # @Controller, @Get...
    ├── di/               # Injection de dépendances
    └── http/             # Gestion HTTP (Request/Response)

```
