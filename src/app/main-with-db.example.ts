// 📚 Exemple: Connexion à une Base de Données avec onModuleInit

import { ClearBoot } from '../lib';
import { Injectable } from '../lib';

/**
 * Simulation d'une classe de connexion DB
 * En production, utilisez TypeORM, Prisma, ou MongoDB native driver
 */
@Injectable()
class DatabaseService {
    private connected = false;

    async connect() {
        console.log('📡 Connexion à la base de données...');
        // Simuler une connexion asynchrone
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.connected = true;
        console.log('✅ Base de données connectée!');
    }

    async disconnect() {
        console.log('🔌 Déconnexion de la base de données...');
        this.connected = false;
        console.log('✅ Base de données déconnectée');
    }

    isConnected() {
        return this.connected;
    }

    async query(sql: string) {
        if (!this.connected) {
            throw new Error('❌ Base de données non connectée');
        }
        console.log(`🔍 Requête SQL: ${sql}`);
        return [{ id: 1, name: 'Example' }];
    }
}

/**
 * Démarrage de l'application avec gestion du lifecycle
 */
async function bootstrap() {
    const db = new DatabaseService();

    const server = await ClearBoot.create({
        port: 3000,
        
        // 👇 Hook exécuté AVANT le démarrage du serveur
        onModuleInit: async () => {
            // Se connecter à la DB avant d'accepter des requêtes
            await db.connect();
            
            // Vérifier que tout est OK
            if (!db.isConnected()) {
                throw new Error('❌ Impossible de démarrer sans DB');
            }
        }
    });

    // 👇 Graceful shutdown déjà géré par ClearBoot
    // Les signaux SIGTERM/SIGINT vont automatiquement:
    // 1. Fermer le serveur HTTP
    // 2. Permettre aux requêtes en cours de finir
    // 3. Exit proprement

    console.log('🎉 Application démarrée avec DB connectée');
    
    // Pour démo: afficher qu'on peut faire des requêtes
    setTimeout(async () => {
        const result = await db.query('SELECT * FROM users');
        console.log('📊 Résultat:', result);
    }, 2000);
}

// Démarrer
if (require.main === module) {
    bootstrap().catch(err => {
        console.error('💥 Erreur au démarrage:', err);
        process.exit(1);
    });
}
