import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { roleMiddleware } from '../middleware/role.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

export class AuthRouter {
    static get routes(): Router {
        const router = Router();
        
        router.post('/', AuthController.login);

        router.patch('/desbloquear/:usuarioId',
            authMiddleware,roleMiddleware(
                ['SUPERADMIN', 'ADMINISTRADOR']),
                AuthController.desbloquearUsuario);

        return router;
    }
}