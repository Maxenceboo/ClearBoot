import * as http from 'http';
import * as dotenv from 'dotenv'; // 👈 Gestion des variables d'environnement
import { globalContainer } from '../di/container';
import { PROVIDERS_REGISTRY } from '../common/types';
import { MetadataScanner } from './metadata-scanner';
import { RequestHandler } from './request-handler';
import { MiddlewareClass } from '../common/interfaces';
import { CorsOptions } from '../http/cors'; // 👈 Gestion du CORS

export interface ModuleConfig {
    port?: number;
    globalMiddlewares?: MiddlewareClass[];
    cors?: CorsOptions; // 👈 Option CORS
}

export class ClearBoot {
    static create(config: ModuleConfig) {
        // 1. Charger les variables d'environnement (.env)
        dotenv.config();

        // 2. Calcul intelligent du port
        // Priorité :
        // 1. Config passée dans le code (ex: create({ port: 0 })) -> Utile pour les tests
        // 2. Variable d'environnement (PORT=4000)
        // 3. Valeur par défaut (3000)
        const port = config.port ?? (process.env.PORT ? parseInt(process.env.PORT) : 3000);

        console.log("\n🚀 Démarrage de ClearBoot...\n");

        // 3. Enregistrement des Services (Providers)
        PROVIDERS_REGISTRY.forEach(P => globalContainer.register(P, new P()));

        // 4. Scan des Contrôleurs
        const controllers = MetadataScanner.scan();
        const globalMiddlewares = config.globalMiddlewares || [];

        // 5. Création du Serveur HTTP
        const server = http.createServer((req, res) => {
            // On passe la config CORS au RequestHandler
            RequestHandler.handle(req, res, controllers, globalMiddlewares, config.cors);
        });

        // 6. Démarrage
        // CORRECTION : On démarre systématiquement avec le port calculé
        server.listen(port, () => {
            // On affiche le log seulement si le port est > 0 (évite le spam en test)
            if (port > 0) console.log(`🔥 Prêt sur port ${port}`);
        });

        return server;
    }
}