"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvExportService = void 0;
class CsvExportService {
    static async generarReporte(datos) {
        const { accesos, inicio, fin } = datos;
        const headers = [
            'Nombre', 'Apellidos', 'Telefono', 'Empresa', 'Area', 'Motivo',
            'Tipo_Identificacion', 'Numero_Identificacion', 'Turno', 'Filtro',
            'Hora_Entrada', 'Hora_Salida', 'Tiempo_Permanencia',
            'Con_Acompanante', 'Nombre_Acompanante', 'Creado_Por', 'Estado'
        ];
        const rows = accesos.map(acceso => {
            const tiempoPermanencia = acceso.horaSalida
                ? CsvExportService.calcularTiempoPermanencia(acceso.horaEntrada, acceso.horaSalida)
                : 'EN_CURSO';
            return [
                acceso.nombre,
                acceso.apellidos,
                acceso.telefono || '',
                acceso.empresa || '',
                acceso.area,
                `"${(acceso.motivo || '').replace(/"/g, '""')}"`,
                acceso.identificacion?.tipo || '',
                acceso.identificacion?.numero || '',
                acceso.turno?.nombreTurno || '',
                acceso.filtro?.nombre || '',
                new Date(acceso.horaEntrada).toISOString(),
                acceso.horaSalida ? new Date(acceso.horaSalida).toISOString() : '',
                tiempoPermanencia,
                acceso.tieneAcompanante ? 'SI' : 'NO',
                acceso.nombreAcompanante || '',
                `${acceso.creador.nombre} ${acceso.creador.apellidos}`,
                acceso.horaSalida ? 'COMPLETADO' : 'ACTIVO'
            ];
        });
        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');
        return {
            buffer: Buffer.from(csvContent, 'utf8'),
            fileName: `reporte_${inicio.toISOString().split('T')[0]}_a_${fin.toISOString().split('T')[0]}.csv`,
            mimeType: 'text/csv; charset=utf-8'
        };
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
}
exports.CsvExportService = CsvExportService;
//# sourceMappingURL=CsvExportService.js.map