import { Request, Response } from 'express';
export declare class AuthController {
    private static readonly MAX_INTENTOS;
    private static readonly TIEMPO_BLOQUEO_MINUTOS;
    private static verificarBloqueoExpirado;
    static login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static desbloquearUsuario: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=auth.controller.d.ts.map