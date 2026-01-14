import { z } from "zod";
import {
  ClearBoot,
  HelmetMiddleware,
  LoggerMiddleware,
  RateLimitMiddleware,
  Controller,
  Get,
  Post,
  Body,
  Validate,
  Injectable,
  IModuleInit,
} from "../lib/index";

// --- 1. Définition du Schéma de Validation (Zod) ---
// On définit ce qu'on attend exactement pour un utilisateur
const CreateUserSchema = z.object({
  username: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  email: z.string().email("Format d'email invalide"),
  age: z.number().min(18, "L'utilisateur doit être majeur").optional(),
});

// --- 2. Création d'un Contrôleur ---
@Controller("/api/users")
class UserController {
  @Get("/")
  getAll() {
    return {
      message: "Liste des utilisateurs récupérée",
      data: [{ id: 1, username: "Maxence" }],
    };
  }

  @Post("/")
  @Validate(CreateUserSchema) // 🛡️ La validation Zod s'exécute ici
  create(@Body() body: any) {
    // Si le code arrive ici, c'est que Zod a validé les données
    console.log("Nouvel utilisateur validé :", body);
    return {
      success: true,
      message: "Utilisateur créé avec succès !",
      user: body,
    };
  }
}

// --- 2bis. Service injectable pour l'initialisation (DB, cache, etc.) ---
@Injectable()
class AppInitService implements IModuleInit {
  async init() {
    // Exemple: connexion DB, vérification de dépendances externes, warming cache
    console.log("🔧 AppInitService: initialisation en cours...");
    // await db.connect(); // décommentez et injectez votre client
    console.log("✅ AppInitService: prêt");
  }
}

@Injectable()
class MetricsInitService implements IModuleInit {
  async init() {
    console.log("📈 MetricsInitService: init metrics/exporters...");
    // Exemple: initialiser un exporteur Prometheus / tracer
    console.log("✅ MetricsInitService: prêt");
  }
}

// --- 3. Initialisation de ClearBoot ---
ClearBoot.create({
  // Configuration des Middlewares Globaux (Ordre important)
  globalMiddlewares: [
    LoggerMiddleware, // 📝 Affiche les requêtes dans la console
    HelmetMiddleware, // 🛡️ Sécurise les headers HTTP
    RateLimitMiddleware, // 🚦 Protège contre le brute-force/spam
  ],

  // Configuration du CORS
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },

  // 🔄 Lifecycle Hooks - exécutés AVANT le démarrage du serveur (ordre défini)
  // Supporte plusieurs classes injectables ou fonctions
  onModuleInit: [AppInitService, MetricsInitService],
});
