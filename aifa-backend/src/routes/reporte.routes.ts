// routes/reporte.routes.ts
import { Router } from 'express';
import { ReporteController } from '../controllers/reporte.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

export class ReporteRouter {
  static get routes(): Router {
    const router = Router();

    router.get('/global',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']),
      ReporteController.getReporteGlobal
    );

    router.get('/estadisticas-rapidas',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']),
      ReporteController.getEstadisticasRapidas
    );

    router.get('/filtro/:filtroId',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']),
      ReporteController.getReportePorFiltro
    );

    router.get('/usuario/:usuarioId',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']),
      ReporteController.getReportePorUsuario
    );

    router.post('/exportar',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']),
      ReporteController.exportarReporte
    );

    return router;
  }
}