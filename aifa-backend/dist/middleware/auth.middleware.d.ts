import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../types/auth.types';
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}
//# sourceMappingURL=auth.middleware.d.ts.map