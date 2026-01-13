import { z } from 'zod';
import {
    ClearBoot,
    HelmetMiddleware,
    LoggerMiddleware,
    RateLimitMiddleware,
    Controller,
    Get,
    Post,
    Body,
    Validate
} from '../lib/index';

// --- 1. Définition du Schéma de Validation (Zod) ---
// On définit ce qu'on attend exactement pour un utilisateur
const CreateUserSchema = z.object({
    username: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
    email: z.string().email("Format d'email invalide"),
    age: z.number().min(18, "L'utilisateur doit être majeur").optional(),
});

// --- 2. Création d'un Contrôleur ---
@Controller('/api/users')
class UserController {

    @Get('/')
    getAll() {
        return {
            message: "Liste des utilisateurs récupérée",
            data: [{ id: 1, username: 'Maxence' }]
        };
    }

    @Post('/')
    @Validate(CreateUserSchema) // 🛡️ La validation Zod s'exécute ici
    create(@Body() body: any) {
        // Si le code arrive ici, c'est que Zod a validé les données
        console.log("Nouvel utilisateur validé :", body);
        return {
            success: true,
            message: "Utilisateur créé avec succès !",
            user: body
        };
    }
}

// --- 3. Initialisation de ClearBoot ---
ClearBoot.create({
    // Configuration des Middlewares Globaux (Ordre important)
    globalMiddlewares: [
        LoggerMiddleware,     // 📝 Affiche les requêtes dans la console
        HelmetMiddleware,     // 🛡️ Sécurise les headers HTTP
        RateLimitMiddleware,  // 🚦 Protège contre le brute-force/spam
    ],

    // Configuration du CORS
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});