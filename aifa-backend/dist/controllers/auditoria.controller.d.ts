import { Request, Response } from 'express';
export declare class AuditoriaController {
    static getLogsFiltro: (req: Request, res: Response) => Promise<void>;
    static getDetalleAuditoria: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getEstadisticasFiltro: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=auditoria.controller.d.ts.map