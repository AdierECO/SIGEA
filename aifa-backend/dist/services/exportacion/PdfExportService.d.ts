import { ExportacionResultado, DatosExportacion } from '../../types/exportacion.types';
export declare class PdfExportService {
    private static currentY;
    private static currentPage;
    private static totalPages;
    private static datosReporte;
    private static logoPath;
    private static logoWidth;
    private static logoHeight;
    private static logoX;
    private static logoY;
    private static contenidoInicioY;
    static configurarLogo(opciones: {
        path?: string;
        base64?: string;
        width?: number;
        height?: number;
    }): void;
    static generarReporte(datos: DatosExportacion): Promise<ExportacionResultado>;
    private static insertarLogoFijo;
    private static agregarEncabezadoPrincipal;
    private static agregarEstadisticasGenerales;
    private static agregarEncabezadoSecundario;
    private static agregarTablaAccesos;
    private static agregarPiePagina;
    private static agregarNuevaPagina;
    private static agruparPorArea;
    private static calcularAlturasCeldas;
    private static formatearNombreCompacto;
    private static agregarGraficaAreas;
    private static agregarMensajeSinDatos;
    private static archivosTemporales;
    private static guardarBase64ComoArchivoTemporal;
    private static limpiarArchivosTemporales;
}
//# sourceMappingURL=PdfExportService.d.ts.map