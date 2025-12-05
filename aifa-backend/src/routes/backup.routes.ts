// routes/backup.routes.ts
import { Router } from 'express';
import { BackupController } from '../controllers/backup.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import multer from 'multer';

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 * 1024
  }
});

export class BackupRouter {
  static get routes(): Router {
    const router = Router();

    router.get('/estadisticas', 
      authMiddleware, 
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'OPERATIVO']),
      BackupController.getEstadisticas
    );

    router.get('/estadisticas-backups',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR']),
      BackupController.getEstadisticasBackups
    );

    router.post('/exportar',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'OPERATIVO']),
      BackupController.exportarDB
    );

    router.post('/importar',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR']),
      upload.single('archivo'),
      BackupController.importarDB
    );

    router.get('/historial',
      authMiddleware,
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'OPERATIVO']),
      BackupController.getHistorial
    );

    return router;
  }
}