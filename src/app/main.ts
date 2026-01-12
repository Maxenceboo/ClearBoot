import * as http from 'http';
import {
    ClearBoot, Controller, Get, Post, Body, Injectable, Middleware
} from '../lib';
import { IMiddleware } from '../lib';
import { ClearResponse } from '../lib';

// --- 1. LE SERVICE (Injection de Dépendances) ---
@Injectable()
class UserService {
    private users = [
        { id: 1, name: "Maxence" },
        { id: 2, name: "Thomas" }
    ];

    findAll() {
        return this.users;
    }

    create(name: string) {
        const newUser = { id: Date.now(), name };
        this.users.push(newUser);
        return newUser;
    }
}

// --- 2. MIDDLEWARE GLOBAL (Logger) ---
@Injectable()
class LoggerMiddleware implements IMiddleware {
    use(req: http.IncomingMessage, res: ClearResponse, next: () => void) {
        const start = Date.now();
        console.log(`📡 [${req.method}] ${req.url}`);

        next(); // On passe à la suite

        const ms = Date.now() - start;
        console.log(`✅ [${req.method}] Terminé en ${ms}ms`);
    }
}

// --- 3. MIDDLEWARE DE SÉCURITÉ (Auth) ---
// Utilise la nouvelle syntaxe fluide res.status().json()
@Injectable()
class AuthMiddleware implements IMiddleware {
    use(req: http.IncomingMessage, res: ClearResponse, next: () => void) {

        // Simulation : Le header 'Authorization' doit valoir 'secret'
        if (req.headers['authorization'] === 'secret') {
            next();
        } else {
            // ✨ NOUVELLE SYNTAXE FLUIDE ✨
            // Plus besoin de writeHead/end
            res.status(401).json({
                error: "Accès Interdit",
                message: "Il manque le header 'Authorization: secret'"
            });
        }
    }
}

// --- 4. LE CONTROLEUR ---
@Controller('/api')
class ApiController {

    // Injection automatique du service via le constructeur
    constructor(private userService: UserService) {}

    // Route Publique
    @Get('/users')
    getUsers() {
        return this.userService.findAll();
    }

    // Route avec Body Parser
    @Post('/users')
    addUser(@Body() body: any) {
        if (!body.name) {
            // On peut aussi renvoyer une erreur brute si besoin
            throw new Error("Le nom est obligatoire");
        }
        return this.userService.create(body.name);
    }

    // Route Protégée par Middleware
    @Get('/admin')
    @Middleware(AuthMiddleware) // 🔒 Sécurité stricte via Classe
    getAdminData() {
        return {
            secret_data: "Code Nucléaire: 123456",
            status: "Super Admin"
        };
    }
}

// --- 5. DÉMARRAGE ---
ClearBoot.create({
    port: 5000,
    globalMiddlewares: [LoggerMiddleware] // Le logger s'applique à tout
});