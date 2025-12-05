import { Request, Response } from 'express';
export declare class UsuarioController {
    static getUsuarios: (req: Request, res: Response) => Promise<void>;
    static getUsuarioById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static createUsuario: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static updateUsuario: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static deleteUsuario: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=usuario.controller.d.ts.map