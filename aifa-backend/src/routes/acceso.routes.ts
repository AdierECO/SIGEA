import { Router } from 'express';
import { AccesoController } from '../controllers/acceso.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

export class accesoRouter {
    static get routes(): Router {
        const router = Router();

        router.get('/', authMiddleware,
            roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), 
            AccesoController.getAccesos);
        router.get('/:id', authMiddleware, 
            roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']),  
            AccesoController.getAccesoById);
        router.post('/', authMiddleware, 
            roleMiddleware(['OPERATIVO']), 
            AccesoController.createAcceso);
        router.put('/:id', authMiddleware, 
            roleMiddleware(['OPERATIVO']), 
        AccesoController.updateAcceso);
        router.patch('/:id/salida', authMiddleware,
            roleMiddleware(['OPERATIVO']), 
            AccesoController.registrarSalida);

        return router
    }
}
