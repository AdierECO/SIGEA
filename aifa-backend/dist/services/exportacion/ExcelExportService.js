"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelExportService = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
class ExcelExportService {
    static async generarReporte(datos) {
        const workbook = new exceljs_1.default.Workbook();
        workbook.creator = 'Sistema AIFA';
        workbook.created = new Date();
        workbook.modified = new Date();
        ExcelExportService.agregarHojaResumen(workbook, datos);
        ExcelExportService.agregarHojaDetalles(workbook, datos);
        ExcelExportService.agregarHojaEstadisticas(workbook, datos);
        // Generar buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return {
            buffer: Buffer.from(buffer),
            fileName: `reporte_detallado_${datos.inicio.toISOString().split('T')[0]}_a_${datos.fin.toISOString().split('T')[0]}.xlsx`,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
    }
    static agregarHojaResumen(workbook, datos) {
        const { accesos, inicio, fin, usuario } = datos;
        const summarySheet = workbook.addWorksheet('Resumen Ejecutivo');
        // Título
        summarySheet.mergeCells('A1:F1');
        const titleCell = summarySheet.getCell('A1');
        titleCell.value = 'SISTEMA AIFA - REPORTE DE ACCESOS';
        titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1e40af' }
        };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        // Información del reporte
        summarySheet.getCell('A3').value = 'Período:';
        summarySheet.getCell('B3').value = `${inicio.toLocaleDateString()} - ${fin.toLocaleDateString()}`;
        summarySheet.getCell('A4').value = 'Generado por:';
        summarySheet.getCell('B4').value = `${usuario?.email}`;
        summarySheet.getCell('A5').value = 'Fecha generación:';
        summarySheet.getCell('B5').value = new Date().toLocaleString();
        // Estadísticas
        const statsStartRow = 7;
        const estadisticas = [
            ['Total de accesos', accesos.length],
            ['Accesos activos', accesos.filter(a => !a.horaSalida).length],
            ['Con identificación', accesos.filter(a => a.identificacionId).length],
            ['Con acompañante', accesos.filter(a => a.tieneAcompanante).length],
            ['Accesos con filtro', accesos.filter(a => a.filtroId).length],
            ['Promedio diario', Math.round(accesos.length / (Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1))]
        ];
        const statsTitleCell = summarySheet.getCell(`A${statsStartRow}`);
        statsTitleCell.value = 'ESTADÍSTICAS';
        statsTitleCell.font = { bold: true, size: 12 };
        estadisticas.forEach(([label, value], index) => {
            summarySheet.getCell(`A${statsStartRow + 1 + index}`).value = label;
            const valueCell = summarySheet.getCell(`B${statsStartRow + 1 + index}`);
            valueCell.value = value;
            valueCell.font = { bold: true };
        });
    }
    static agregarHojaDetalles(workbook, datos) {
        const { accesos } = datos;
        const detailsSheet = workbook.addWorksheet('Detalles de Accesos');
        // Encabezados
        const headers = [
            'Nombre', 'Apellidos', 'Teléfono', 'Empresa', 'Área', 'Motivo',
            'Identificación', 'Número ID', 'Turno', 'Filtro',
            'Hora Entrada', 'Hora Salida', 'Tiempo Permanencia',
            'Con Acompañante', 'Nombre Acompañante', 'Creado Por'
        ];
        detailsSheet.addRow(headers);
        // Estilo para encabezados
        const headerRow = detailsSheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1e40af' }
        };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        // Datos
        accesos.forEach(acceso => {
            const tiempoPermanencia = acceso.horaSalida
                ? ExcelExportService.calcularTiempoPermanencia(acceso.horaEntrada, acceso.horaSalida)
                : 'En curso';
            detailsSheet.addRow([
                acceso.nombre,
                acceso.apellidos,
                acceso.telefono || 'N/A',
                acceso.empresa || 'N/A',
                acceso.area,
                acceso.motivo,
                acceso.identificacion?.tipo || 'N/A',
                acceso.identificacion?.numero || 'N/A',
                acceso.turno?.nombreTurno || 'N/A',
                acceso.filtro?.nombre || 'N/A',
                new Date(acceso.horaEntrada).toLocaleString(),
                acceso.horaSalida ? new Date(acceso.horaSalida).toLocaleString() : 'Activo',
                tiempoPermanencia,
                acceso.tieneAcompanante ? 'Sí' : 'No',
                acceso.nombreAcompanante || 'N/A',
                `${acceso.creador.nombre} ${acceso.creador.apellidos}`
            ]);
        });
        // Autoajustar columnas
        detailsSheet.columns.forEach((column) => {
            if (column && typeof column.eachCell === 'function') {
                let maxLength = 0;
                column.eachCell({ includeEmpty: true }, (cell) => {
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                });
                if (column.width === undefined) {
                    column.width = Math.min(maxLength + 2, 50);
                }
            }
        });
    }
    static agregarHojaEstadisticas(workbook, datos) {
        const { accesos } = datos;
        const statsSheet = workbook.addWorksheet('Estadísticas Avanzadas');
        const analysisTitleCell = statsSheet.getCell('A1');
        analysisTitleCell.value = 'Análisis por Área';
        analysisTitleCell.font = { bold: true, size: 14 };
        const areas = ExcelExportService.agruparPorArea(accesos);
        let rowIndex = 3;
        Object.entries(areas).forEach(([area, count]) => {
            statsSheet.getCell(`A${rowIndex}`).value = area;
            statsSheet.getCell(`B${rowIndex}`).value = count;
            rowIndex++;
        });
    }
    static calcularTiempoPermanencia(entrada, salida) {
        const diffMs = new Date(salida).getTime() - new Date(entrada).getTime();
        const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        if (diffHoras > 0) {
            return `${diffHoras}h ${diffMinutos}m`;
        }
        return `${diffMinutos}m`;
    }
    static agruparPorArea(accesos) {
        return accesos.reduce((acc, acceso) => {
            const area = acceso.area || 'Sin área especificada';
            acc[area] = (acc[area] || 0) + 1;
            return acc;
        }, {});
    }
}
exports.ExcelExportService = ExcelExportService;
//# sourceMappingURL=ExcelExportService.js.map