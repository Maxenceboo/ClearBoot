// On importe TOUT depuis la lib (plus de '../app/...')
import { ClearBoot, HelmetMiddleware, LoggerMiddleware } from '../lib/index';
import { UserController } from './controllers/user.controller';

ClearBoot.create({
    // ...
    globalMiddlewares: [
        LoggerMiddleware, // Vient de la lib
        HelmetMiddleware  // Vient de la lib
    ],
    // ...
});