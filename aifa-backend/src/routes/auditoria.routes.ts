import { Router } from 'express';
import { AuditoriaController } from '../controllers/auditoria.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

export class AuditoriaRouter {
  static get routes(): Router {
    const router = Router();

    router.get('/filtro',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']),
      AuditoriaController.getLogsFiltro
    );

     router.get('/:id',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']),
      AuditoriaController.getDetalleAuditoria
    );

    router.get('/filtro/estadisticas',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']),
      AuditoriaController.getEstadisticasFiltro
    );

    return router;
  }
}