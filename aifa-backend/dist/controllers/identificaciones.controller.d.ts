import { Request, Response } from 'express';
export declare class IdentificacionController {
    static getIdentificaciones: (req: Request, res: Response) => Promise<void>;
    static getIdentificacionById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getIdentificacionByNumero: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static createIdentificacion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static updateIdentificacion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static toggleVigenciaIdentificacion: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getIdentificacionesVigentes: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=identificaciones.controller.d.ts.map