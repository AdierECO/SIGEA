import { Request, Response, NextFunction } from 'express';
import { Rol } from '../types/usuario.types';
export declare const roleMiddleware: (roles: Rol[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=role.middleware.d.ts.map