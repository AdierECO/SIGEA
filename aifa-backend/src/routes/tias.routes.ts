import { Router } from 'express';
import { TIASController } from '../controllers/tias.Controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

export class TIASRouter {
    static get routes(): Router {
        const router = Router();

        router.get('/disponibles', authMiddleware,
            roleMiddleware(['ADMINISTRADOR', 'OPERATIVO']),
            TIASController.getTIASDisponibles);

        router.get('/', authMiddleware,
            roleMiddleware(['ADMINISTRADOR', 'OPERATIVO']),
            TIASController.getTIAS);

        router.get('/estadisticas', authMiddleware,
            roleMiddleware(['ADMINISTRADOR', 'OPERATIVO']),
            TIASController.getEstadisticasTIAS);

        router.get('/:id', authMiddleware,
            roleMiddleware(['ADMINISTRADOR', 'OPERATIVO']),
            TIASController.getTIASById);

        router.post('/', authMiddleware,
            roleMiddleware(['ADMINISTRADOR', 'OPERATIVO']),
            TIASController.createTIAS);

        router.post('/rango', authMiddleware,
            roleMiddleware(['ADMINISTRADOR']),
            TIASController.createTIASRango);

        router.put('/:id', authMiddleware,
            roleMiddleware(['ADMINISTRADOR']),
            TIASController.updateTIAS);

        router.delete('/:id', authMiddleware,
            roleMiddleware(['ADMINISTRADOR']),
            TIASController.deleteTIAS);

        return router;
    }
}