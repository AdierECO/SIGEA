import { Router } from 'express';
import { TurnoController } from '../controllers/turno.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

export class turnoRouter {
    static get routes(): Router {
        const router = Router();

        router.get('/', authMiddleware,
            roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']),
            TurnoController.getTurnos);

        router.get('/activos', authMiddleware,
            roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']),
            TurnoController.getTurnosActivos);

        router.get('/:id', authMiddleware,
            roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']),
            TurnoController.getTurnoById);

        router.post('/', authMiddleware,
            roleMiddleware(['ADMINISTRADOR']),
            TurnoController.createTurno);

        router.put('/:id', authMiddleware,
            roleMiddleware(['ADMINISTRADOR']),
            TurnoController.updateTurno);

        router.patch('/:id/asignar', authMiddleware,
            roleMiddleware(['ADMINISTRADOR']),
            TurnoController.asignarTurno);

        router.patch('/:id/desasignarall', authMiddleware,
            roleMiddleware(['ADMINISTRADOR']),
            TurnoController.desasignarTurno);

        router.delete('/:id/desasignar', authMiddleware,
            roleMiddleware(['ADMINISTRADOR']),
            TurnoController.desasignarUsuarioTurno);

        router.delete('/delete/:id/', authMiddleware,
            roleMiddleware(['ADMINISTRADOR']),
            TurnoController.deleteTurno);

        return router
    }
}
