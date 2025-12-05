// routes/filtro.routes.ts
import { Router } from 'express';
import { FiltroController } from '../controllers/filtro.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

export class FiltroRouter {
  static get routes(): Router {
    const router = Router();

    router.get('/activos', FiltroController.getFiltrosActivos);

    router.get('/', 
      authMiddleware, 
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']),
      FiltroController.getFiltros
    );

    router.get('/:id', 
      authMiddleware, 
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']),
      FiltroController.getFiltroById
    );

    router.post('/',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR']),
      FiltroController.createFiltro
    );

    router.put('/:id',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR']),
      FiltroController.updateFiltro
    );

    router.delete('/:id',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR']),
      FiltroController.deleteFiltro
    );
    return router;
  }
}