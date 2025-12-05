import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { IdentificacionController } from '../controllers/identificaciones.controller';
import { roleMiddleware } from '../middleware/role.middleware';

export class IdRouter {
    static get routes(): Router {
        const router = Router();

        // Usar el método estático directamente
        router.get('/', authMiddleware,
            roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']),
            IdentificacionController.getIdentificacionesVigentes);

        router.get('/all', authMiddleware,
            roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']),
            IdentificacionController.getIdentificaciones);

        router.get('/:id', authMiddleware,
            roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']),
            IdentificacionController.getIdentificacionById);

        router.get('/numero/:numero', authMiddleware,
            roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']),
            IdentificacionController.getIdentificacionByNumero);

        router.post('/', authMiddleware,
            roleMiddleware(['OPERATIVO']),
            IdentificacionController.createIdentificacion);

        router.put('/:id', authMiddleware,
            roleMiddleware(['OPERATIVO']),
            IdentificacionController.updateIdentificacion);

        router.patch('/:id/vigencia', authMiddleware,
            roleMiddleware(['OPERATIVO']),
            IdentificacionController.toggleVigenciaIdentificacion)

        return router;
    }
}