import { Request, Response, NextFunction } from 'express';
import { JwtAdapter } from '../config';
import { JwtPayload } from '../types/auth.types';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const payload = await JwtAdapter.validateToken<JwtPayload>(token);
    if (!payload) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = payload;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Token inválido' });
  }
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}