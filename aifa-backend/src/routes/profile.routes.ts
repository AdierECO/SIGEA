import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ProfileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export class profileRouter {
    static get routes(): Router {
        const router = Router();

        // Usar el método estático directamente
        router.get('/mi-perfil', authMiddleware, ProfileController.getMiPerfil);
        router.put('/mi-perfil', authMiddleware, ProfileController.updateMiPerfil);
        router.patch('/cambiar-password', authMiddleware, ProfileController.cambiarPassword);
        router.get('/estadisticas', authMiddleware, ProfileController.getMisEstadisticas);

        return router;
    }
}