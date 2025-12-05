import { ExportacionResultado, DatosExportacion } from '../../types/exportacion.types';
export declare class PdfExportService {
    private static currentY;
    private static currentPage;
    private static totalPages;
    private static datosReporte;
    static generarReporte(datos: DatosExportacion): Promise<ExportacionResultado>;
    private static agregarEncabezadoPrincipal;
    private static agregarEstadisticasGenerales;
    private static agregarTablaAccesos;
    private static agregarGraficaAreas;
    private static agregarEncabezadoSecundario;
    private static agregarMensajeSinDatos;
    private static agregarPiePagina;
    private static agregarNuevaPagina;
    private static agruparPorArea;
    private static calcularAlturasCeldas;
    private static formatearNombreCompacto;
}
//# sourceMappingURL=PdfExportService.d.ts.map