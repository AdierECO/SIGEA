import { Request, Response, NextFunction } from 'express';
import { Rol } from '../types/usuario.types';

export const roleMiddleware = (roles: Rol[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (!roles.includes(req.user.rol as Rol)) {
      return res.status(403).json({ error: 'No tiene permisos para esta acción' });
    }

    next();
  };
};