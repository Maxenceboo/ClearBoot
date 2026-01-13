# Phase 2: Cycle de Vie & Base de Données

ClearBoot v2 supporte maintenant les **Lifecycle Hooks** et le **Graceful Shutdown** pour gérer correctement les connexions externes (DB, cache, etc.).

## 🔄 Lifecycle Hooks

### `onModuleInit()` - Initialisation du Module

Le hook `onModuleInit()` s'exécute **AVANT** que le serveur ne commence à écouter sur le port. Parfait pour:
- Connexion à la base de données
- Vérification de la santé des services
- Chargement de configuration depuis une source externe
- Migration de la DB
- Préréchauffage du cache

### Exemple Basique

```typescript
import { ClearBoot } from 'clearboot';

const server = await ClearBoot.create({
    port: 3000,
    
    onModuleInit: async () => {
        console.log('⏳ Initialisation...');
        // Votre logique async ici
        await someAsyncSetup();
        console.log('✅ Prêt!');
    }
});
```

### Exemple: Connexion à une Base de Données

```typescript
@Injectable()
class DatabaseService {
    private connection: any;

    async connect() {
        console.log('📡 Connexion à PostgreSQL...');
        this.connection = await postgres.connect({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log('✅ Connecté à PostgreSQL');
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.close();
        }
    }

    async query(sql: string, params: any[] = []) {
        return this.connection.query(sql, params);
    }
}

// Application avec DB
async function bootstrap() {
    const db = inject(DatabaseService);
    
    const server = await ClearBoot.create({
        port: 3000,
        
        onModuleInit: async () => {
            console.log('🔧 Initialisation de la DB...');
            await db.connect();
            
            // Vérifier la connexion
            try {
                await db.query('SELECT 1');
                console.log('✅ Base de données opérationnelle');
            } catch (error) {
                throw new Error('❌ Impossible de connexion à la DB');
            }
        }
    });
}

bootstrap().catch(err => {
    console.error('💥 Erreur critique:', err.message);
    process.exit(1);
});
```

---

## 🛑 Graceful Shutdown

ClearBoot gère automatiquement les signaux **SIGTERM** et **SIGINT** (Ctrl+C) pour arrêter proprement l'application:

1. **Fermer le serveur HTTP** - Pas de nouvelles connexions
2. **Laisser les requêtes en cours** se terminer
3. **Fermer les connexions externes** (DB, Redis, etc.)
4. **Quitter proprement** (exit code 0)
5. **Force quit après 10s** si pas terminé (exit code 1)

### Manuel: Cleanup personnalisé

```typescript
async function bootstrap() {
    const db = inject(DatabaseService);
    
    const server = await ClearBoot.create({
        port: 3000,
        onModuleInit: async () => await db.connect()
    });

    // Si besoin de cleanup manuel en plus
    process.on('SIGTERM', async () => {
        console.log('Fermeture gracieuse...');
        await db.disconnect(); // Cleanup personnalisé
        server.close(() => process.exit(0));
    });
}
```

**Note**: Le shutdown gracieux est **déjà intégré** dans `ClearBoot.create()` - pas besoin de l'ajouter manuellement!

---

## 📦 Intégration ORM

### TypeORM

```typescript
import { DataSource } from 'typeorm';
import { ClearBoot } from 'clearboot';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [User, Post, Comment],
    synchronize: true
});

async function bootstrap() {
    // Initialiser TypeORM
    await AppDataSource.initialize();
    console.log('✅ TypeORM initialisé');

    const server = await ClearBoot.create({
        port: 3000,
        onModuleInit: async () => {
            console.log('🚀 Application démarrée avec TypeORM');
        }
    });

    // Cleanup
    process.on('SIGTERM', async () => {
        await AppDataSource.destroy();
        server.close(() => process.exit(0));
    });
}

bootstrap();
```

### Prisma

```typescript
import { PrismaClient } from '@prisma/client';
import { ClearBoot } from 'clearboot';

const prisma = new PrismaClient();

async function bootstrap() {
    const server = await ClearBoot.create({
        port: 3000,
        onModuleInit: async () => {
            console.log('🔗 Vérification de la connexion Prisma...');
            await prisma.$queryRaw`SELECT 1`;
            console.log('✅ Prisma prêt');
        }
    });

    // Cleanup
    process.on('SIGINT', async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
}

bootstrap();
```

### MongoDB (Native Driver)

```typescript
import { MongoClient } from 'mongodb';
import { ClearBoot } from 'clearboot';

const client = new MongoClient(process.env.MONGODB_URI);

async function bootstrap() {
    const server = await ClearBoot.create({
        port: 3000,
        onModuleInit: async () => {
            console.log('🗄️  Connexion à MongoDB...');
            await client.connect();
            const db = client.db('myapp');
            const ping = await db.admin().ping();
            console.log('✅ MongoDB connecté');
        }
    });

    // Cleanup
    process.on('SIGTERM', async () => {
        await client.close();
        server.close(() => process.exit(0));
    });
}

bootstrap();
```

---

## 🧪 Tests avec Lifecycle Hooks

```typescript
describe('Application avec DB', () => {
    let server: http.Server;
    let db: DatabaseService;

    beforeAll(async () => {
        db = inject(DatabaseService);
        
        server = await ClearBoot.create({
            port: 0, // Port aléatoire pour tests
            onModuleInit: async () => {
                await db.connectToTestDB(); // DB test, pas production!
            }
        });
    });

    afterAll(async () => {
        await db.disconnect();
        server.close();
    });

    test('Les données de la DB sont accessibles', async () => {
        const users = await db.query('SELECT * FROM users');
        expect(users).toBeDefined();
    });
});
```

---

## ⚠️ Erreurs Courantes

### ❌ Oublier `await` sur `ClearBoot.create()`

```typescript
// ❌ MAUVAIS
const server = ClearBoot.create({...}); // Retourne une Promise!
server.listen(3000); // ❌ TypeError

// ✅ BON
const server = await ClearBoot.create({...});
```

### ❌ Ne pas utiliser `async` dans `onModuleInit`

```typescript
// ❌ MAUVAIS
onModuleInit: () => {
    setTimeout(() => db.connect(), 1000); // Pas attendu!
}

// ✅ BON
onModuleInit: async () => {
    await db.connect(); // Attendu correctement
}
```

### ❌ Lancer une exception non capturée

```typescript
// ❌ MAUVAIS - L'exception n'est pas propagée
const server = await ClearBoot.create({
    onModuleInit: async () => {
        throw new Error('DB Error'); // Pas capturé!
    }
});

// ✅ BON
try {
    const server = await ClearBoot.create({
        onModuleInit: async () => {
            await db.connect(); // Exception propagée
        }
    });
} catch (error) {
    console.error('Erreur au démarrage:', error);
    process.exit(1);
}
```

---

## 📊 Flux de Démarrage

```
1. dotenv.config() - Charger .env
2. Enregistrer les Services (Providers)
3. ⏳ onModuleInit() - Votre code custom (DB, etc.)
4. Scanner les Contrôleurs
5. Créer le serveur HTTP
6. Écouter sur le port
7. ✅ Prêt à recevoir des requêtes

--- Lors de SIGTERM/SIGINT ---
1. ⚠️ Signal reçu
2. Fermer le serveur HTTP
3. Laisser les requêtes en cours finir
4. ✅ Exit proprement (exit code 0)
```

---

## ✅ Checklist Phase 2

- [x] Lifecycle Hook `onModuleInit()` implémenté
- [x] Graceful Shutdown (SIGTERM/SIGINT) implémenté
- [x] Exemples TypeORM/Prisma/MongoDB
- [x] Tests avec lifecycle
- [ ] Exemple production-ready
- [ ] Guide avancé (Circuit Breaker, Health Checks)

---

## 🚀 Prochain: Phase 3

La prochaine phase ajoutera:
- Support Cookies (`req.cookies`, `res.cookie()`)
- Support Form-Data (`application/x-www-form-urlencoded`)
- Upload de Fichiers (`multipart/form-data`)
