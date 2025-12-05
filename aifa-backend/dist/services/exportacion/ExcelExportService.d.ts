import { ExportacionResultado, DatosExportacion } from '../../types/exportacion.types';
export declare class ExcelExportService {
    static generarReporte(datos: DatosExportacion): Promise<ExportacionResultado>;
    private static agregarHojaResumen;
    private static agregarHojaDetalles;
    private static agregarHojaEstadisticas;
    private static calcularTiempoPermanencia;
    private static agruparPorArea;
}
//# sourceMappingURL=ExcelExportService.d.ts.map