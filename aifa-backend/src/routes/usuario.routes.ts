import { Router } from 'express';
import { UsuarioController } from '../controllers/usuario.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';

export class usuarioRouter{
  static get routes(): Router{
    const router = Router();
    router.get('/', 
      authMiddleware, 
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), 
      UsuarioController.getUsuarios
    );
    
    router.get('/:id', 
      authMiddleware, 
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), 
      UsuarioController.getUsuarioById
    );
    
    router.post('/', 
      authMiddleware, 
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR']), 
      UsuarioController.createUsuario
    );
    
    router.put('/:id', 
      authMiddleware, 
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR', 'OPERATIVO']), 
      UsuarioController.updateUsuario
    );
    
    router.delete('/delete/:id', 
      authMiddleware, 
      roleMiddleware(['SUPERADMIN', 'ADMINISTRADOR']), 
      UsuarioController.deleteUsuario
    );

      return router
  }
};