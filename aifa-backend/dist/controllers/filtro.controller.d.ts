import { Request, Response } from 'express';
export declare class FiltroController {
    static getFiltros: (req: Request, res: Response) => Promise<void>;
    static getFiltroById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getFiltrosActivos: (req: Request, res: Response) => Promise<void>;
    static createFiltro: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static updateFiltro: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static deleteFiltro: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=filtro.controller.d.ts.map