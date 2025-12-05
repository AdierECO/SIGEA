import { Request, Response } from 'express';
export declare class ReporteController {
    static getReporteGlobal: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static exportarReporte: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    private static agruparPorArea;
    private static agruparPorMotivo;
    private static agruparPorFiltro;
    private static agruparPorTurno;
    private static agruparPorCreador;
    private static agruparPorDia;
    static getReportePorFiltro: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getReportePorUsuario: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    static getEstadisticasRapidas: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=reporte.controller.d.ts.map