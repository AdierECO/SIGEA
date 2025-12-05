import { Request, Response } from 'express';
export declare class AccesoController {
    static getAccesos: (req: Request, res: Response) => Promise<void>;
    static getAccesoById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static createAcceso: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static updateAcceso: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static registrarSalida: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=acceso.controller.d.ts.map