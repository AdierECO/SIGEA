import { Request, Response } from 'express';
export declare class BackupController {
    static getEstadisticas: (req: Request, res: Response) => Promise<void>;
    static exportarDB: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    private static exportarJSON;
    private static exportarSQL;
    private static generarEstructuraSQL;
    private static generarDatosSQL;
    static importarDB: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    private static importarDesdeSQL;
    private static importarDesdeJSON;
    private static crearBackupAutomatico;
    static getHistorial: (req: Request, res: Response) => Promise<void>;
    static getEstadisticasBackups: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=backup.controller.d.ts.map