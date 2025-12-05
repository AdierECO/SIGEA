import { Request, Response } from 'express';
export declare class TIASController {
    static getTIAS: (req: Request, res: Response) => Promise<void>;
    static getTIASById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static createTIAS: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static createTIASRango: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static updateTIAS: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static deleteTIAS: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getTIASDisponibles: (req: Request, res: Response) => Promise<void>;
    static getEstadisticasTIAS: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=tias.Controller.d.ts.map