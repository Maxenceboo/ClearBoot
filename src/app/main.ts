import {
    ClearBoot, Controller, Get, Post, Body, Injectable, inject, Middleware, IMiddleware,ClearResponse
} from '../lib';

// --- SERVICE ---
@Injectable()
class UserService {
    private db = ["Max", "Tom"];

    findAll() { return this.db; }
    add(name: string) { this.db.push(name); }
}

// --- MIDDLEWARE AVEC INJECTION ---
@Injectable()
class AuthMiddleware implements IMiddleware {
    // 🔥 Injection dans un Middleware !
    private readonly userService = inject(UserService);

    use(req: any, res: ClearResponse, next: () => void) {
        console.log("Users en base:", this.userService.findAll().length);
        if (req.headers.auth === 'secret') next();
        else res.status(401).json({ error: "No Auth" });
    }
}

// --- CONTROLEUR ---
@Controller('/users')
class UserController {

    // ✨ C'est ici que tu voulais ton changement ✨
    // Plus de constructeur, plus de @InjectProperty
    private readonly userService = inject(UserService);

    @Get('/')
    getAll() {
        return this.userService.findAll();
    }

    @Post('/')
    create(@Body() body: any) {
        this.userService.add(body.name);
        return { success: true };
    }

    @Get('/admin')
    @Middleware(AuthMiddleware)
    admin() {
        return { mode: 'admin' };
    }
}

ClearBoot.create({ port: 5000 });