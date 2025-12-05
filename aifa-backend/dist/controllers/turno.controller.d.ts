import { Request, Response } from 'express';
export declare class TurnoController {
    static getTurnos: (req: Request, res: Response) => Promise<void>;
    static getTurnoById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static createTurno: (req: Request, res: Response) => Promise<void>;
    static updateTurno: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static asignarTurno: (req: Request, res: Response) => Promise<void>;
    static deleteTurno: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getTurnosActivos: (req: Request, res: Response) => Promise<void>;
    static desasignarTurno: (req: Request, res: Response) => Promise<void>;
    static desasignarUsuarioTurno: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=turno.controller.d.ts.map