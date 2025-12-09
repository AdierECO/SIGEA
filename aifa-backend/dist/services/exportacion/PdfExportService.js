"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfExportService = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class PdfExportService {
    static currentY = 0;
    static currentPage = 1;
    static totalPages = 1;
    static datosReporte = null;
    // ==================== CONFIGURACIÓN DEL LOGO ====================
    static logoPath = path_1.default.join(process.cwd(), 'assets', 'logo.png');
    // TAMAÑOS DEL LOGO (ajusta estos valores según tu logo)
    static logoWidth = 170; // Logo más pequeño pero visible
    static logoHeight = 70; // Mantener proporción
    // POSICIÓN FIJA DEL LOGO (NO afecta al contenido)
    static logoX = 10; // Margen izquierdo fijo
    static logoY = 20; // Margen superior fijo
    // ==================== POSICIÓN INICIAL DEL CONTENIDO (DEBAJO DEL LOGO) ====================
    static contenidoInicioY = 90; // 30 (logoY) + 40 (logoHeight) + 20 (espacio)
    // ==================== FIN DE CONFIGURACIÓN ====================
    static configurarLogo(opciones) {
        if (opciones.path) {
            if (fs_1.default.existsSync(opciones.path)) {
                this.logoPath = opciones.path;
            }
            else {
                console.warn(`⚠️ Logo no encontrado en: ${opciones.path}`);
                this.logoPath = '';
            }
        }
        if (opciones.base64) {
            this.logoPath = this.guardarBase64ComoArchivoTemporal(opciones.base64);
        }
        if (opciones.width)
            this.logoWidth = opciones.width;
        if (opciones.height)
            this.logoHeight = opciones.height;
        // Recalcular la posición inicial del contenido si cambia el tamaño del logo
        this.contenidoInicioY = this.logoY + this.logoHeight + 20;
    }
    static async generarReporte(datos) {
        return new Promise((resolve, reject) => {
            try {
                const { accesos, inicio, fin, usuario } = datos;
                PdfExportService.datosReporte = datos;
                const doc = new pdfkit_1.default({
                    margin: 50,
                    size: 'A4',
                    bufferPages: true
                });
                const buffers = [];
                PdfExportService.currentY = PdfExportService.contenidoInicioY;
                PdfExportService.currentPage = 1;
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const buffer = Buffer.concat(buffers);
                    resolve({
                        buffer,
                        fileName: `reporte_accesos_${inicio.toISOString().split('T')[0]}_a_${fin.toISOString().split('T')[0]}.pdf`,
                        mimeType: 'application/pdf'
                    });
                });
                // ==================== PÁGINA 1 ====================
                PdfExportService.insertarLogoFijo(doc);
                PdfExportService.agregarEncabezadoPrincipal(doc);
                PdfExportService.agregarEstadisticasGenerales(doc, accesos);
                PdfExportService.agregarPiePagina(doc, 'Información General');
                if (accesos.length > 0) {
                    // ==================== PÁGINA 2 ====================
                    PdfExportService.agregarNuevaPagina(doc);
                    PdfExportService.insertarLogoFijo(doc);
                    PdfExportService.agregarEncabezadoSecundario(doc, 'Registros de Acceso Detallados');
                    PdfExportService.agregarTablaAccesos(doc, accesos);
                    // El pie de página se agrega al final de la tabla
                    // ==================== PÁGINA 3 ====================
                    PdfExportService.agregarNuevaPagina(doc);
                    PdfExportService.insertarLogoFijo(doc);
                    PdfExportService.agregarEncabezadoSecundario(doc, 'Distribución por Áreas');
                    PdfExportService.agregarGraficaAreas(doc, accesos);
                    // El pie de página se agrega dentro del método
                }
                else {
                    // ==================== PÁGINA 2 SIN DATOS ====================
                    PdfExportService.agregarNuevaPagina(doc);
                    PdfExportService.insertarLogoFijo(doc);
                    PdfExportService.agregarEncabezadoSecundario(doc, 'Sin Registros');
                    PdfExportService.agregarMensajeSinDatos(doc);
                    PdfExportService.agregarPiePagina(doc, 'Sin Registros');
                }
                PdfExportService.totalPages = PdfExportService.currentPage;
                doc.end();
            }
            catch (error) {
                reject(error);
            }
        });
    }
    // ==================== LOGO EN POSICIÓN FIJA ====================
    static insertarLogoFijo(doc) {
        if (!PdfExportService.logoPath || !fs_1.default.existsSync(PdfExportService.logoPath)) {
            return;
        }
        try {
            // Insertar logo en posición fija (NO afecta currentY)
            doc.image(PdfExportService.logoPath, PdfExportService.logoX, PdfExportService.logoY, {
                width: PdfExportService.logoWidth,
                height: PdfExportService.logoHeight
            });
            console.log(`✅ Logo insertado en posición fija: (${PdfExportService.logoX}, ${PdfExportService.logoY})`);
        }
        catch (error) {
            console.warn('⚠️ Error insertando logo:', error);
        }
    }
    // ==================== ENCABEZADO PRINCIPAL ====================
    static agregarEncabezadoPrincipal(doc) {
        if (!PdfExportService.datosReporte)
            return;
        const { inicio, fin, usuario } = PdfExportService.datosReporte;
        const nombreUsuario = usuario && usuario.nombre && usuario.apellidos
            ? `${usuario.nombre} ${usuario.apellidos}`
            : (usuario?.nombre || usuario?.email || 'Usuario no disponible');
        // Título centrado (empieza en contenidoInicioY)
        doc.fillColor('#1e40af')
            .fontSize(24)
            .font('Helvetica-Bold')
            .text('SIGEA - REPORTE DE ACCESOS', 50, PdfExportService.currentY, { align: 'center' });
        PdfExportService.currentY += 30;
        // Información centrada
        doc.fillColor('#666666')
            .fontSize(10)
            .font('Helvetica')
            .text(`Período: ${inicio.toLocaleDateString()} - ${fin.toLocaleDateString()}`, 50, PdfExportService.currentY, { align: 'center' });
        PdfExportService.currentY += 15;
        doc.fillColor('#666666')
            .fontSize(10)
            .font('Helvetica')
            .text(`Generado por: ${nombreUsuario}`, 50, PdfExportService.currentY, { align: 'center' });
        PdfExportService.currentY += 15;
        doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 50, PdfExportService.currentY, { align: 'center' });
        PdfExportService.currentY += 40;
    }
    // ==================== ESTADÍSTICAS GENERALES ====================
    static agregarEstadisticasGenerales(doc, accesos) {
        doc.fillColor('#000000')
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('RESUMEN EJECUTIVO', 50, PdfExportService.currentY);
        PdfExportService.currentY += 25;
        const totalAccesos = accesos.length;
        const accesosActivos = accesos.filter(a => !a.horaSalida).length;
        const accesosCompletados = totalAccesos - accesosActivos;
        const conIdentificacion = accesos.filter(a => a.identificacionId).length;
        const conAcompanante = accesos.filter(a => a.tieneAcompanante).length;
        const stats = [
            `• Total de accesos registrados: ${totalAccesos}`,
            `• Accesos activos (sin salida): ${accesosActivos}`,
            `• Accesos completados: ${accesosCompletados}`,
            `• Registros con identificación: ${conIdentificacion}`,
            `• Registros con acompañante: ${conAcompanante}`,
            `• Tasa de completitud: ${totalAccesos > 0 ? ((accesosCompletados / totalAccesos) * 100).toFixed(1) : 0}%`
        ];
        doc.fillColor('#333333')
            .fontSize(9)
            .font('Helvetica')
            .text(stats.join('\n'), 50, PdfExportService.currentY, {
            lineGap: 8
        });
        PdfExportService.currentY += stats.length * 20 + 30;
    }
    // ==================== ENCABEZADO SECUNDARIO ====================
    static agregarEncabezadoSecundario(doc, titulo) {
        if (!PdfExportService.datosReporte)
            return;
        // Título centrado
        doc.fillColor('#1e40af')
            .fontSize(18)
            .font('Helvetica-Bold')
            .text(titulo, 50, PdfExportService.currentY, { align: 'center' });
        PdfExportService.currentY += 25;
    }
    // ==================== TABLA DE ACCESOS ====================
    static agregarTablaAccesos(doc, accesos) {
        PdfExportService.currentY = PdfExportService.contenidoInicioY + 50;
        const columnWidths = [70, 130, 100, 75, 75, 70];
        const baseRowHeight = 25;
        const headers = ['Nombre', 'Área', 'Motivo', 'Entrada', 'Salida', 'Filtro'];
        // Encabezado de tabla
        doc.fillColor('#1e40af')
            .rect(50, PdfExportService.currentY, 520, baseRowHeight)
            .fill();
        let xPos = 50;
        doc.fillColor('#ffffff')
            .fontSize(9)
            .font('Helvetica-Bold');
        headers.forEach((header, index) => {
            doc.text(header, xPos + 5, PdfExportService.currentY + 9, {
                width: columnWidths[index] - 10,
                align: 'left'
            });
            xPos += columnWidths[index];
        });
        PdfExportService.currentY += baseRowHeight;
        // Restablecer fuente normal para datos
        doc.fillColor('#333333')
            .fontSize(9)
            .font('Helvetica');
        let registrosEnPagina = 0;
        const maxRegistrosPorPagina = 15;
        accesos.forEach((acceso, index) => {
            // Verificar si necesitamos nueva página por límite de registros
            if (registrosEnPagina >= maxRegistrosPorPagina) {
                // Agregar pie de página para la página actual
                PdfExportService.agregarPiePagina(doc, 'Registros Detallados');
                // Crear nueva página
                PdfExportService.agregarNuevaPagina(doc);
                PdfExportService.insertarLogoFijo(doc);
                PdfExportService.currentY = PdfExportService.contenidoInicioY + 50;
                registrosEnPagina = 0;
                // Solo encabezado de tabla en nueva página (sin título)
                doc.fillColor('#1e40af')
                    .rect(50, PdfExportService.currentY, 520, baseRowHeight)
                    .fill();
                xPos = 50;
                doc.fillColor('#ffffff')
                    .fontSize(10)
                    .font('Helvetica-Bold');
                headers.forEach((header, idx) => {
                    doc.text(header, xPos + 5, PdfExportService.currentY + 9, {
                        width: columnWidths[idx] - 10,
                        align: 'left'
                    });
                    xPos += columnWidths[idx];
                });
                PdfExportService.currentY += baseRowHeight;
                // Restablecer fuente normal para datos
                doc.fillColor('#333333')
                    .fontSize(9)
                    .font('Helvetica');
            }
            // Verificar si necesitamos nueva página por espacio vertical
            if (PdfExportService.currentY > 650 && index < accesos.length - 1) {
                // Agregar pie de página para la página actual
                PdfExportService.agregarPiePagina(doc, 'Registros Detallados');
                // Crear nueva página
                PdfExportService.agregarNuevaPagina(doc);
                PdfExportService.insertarLogoFijo(doc);
                PdfExportService.currentY = PdfExportService.contenidoInicioY + 50;
                registrosEnPagina = 0;
                // Solo encabezado de tabla en nueva página (sin título)
                doc.fillColor('#1e40af')
                    .rect(50, PdfExportService.currentY, 520, baseRowHeight)
                    .fill();
                xPos = 50;
                doc.fillColor('#ffffff')
                    .fontSize(10)
                    .font('Helvetica-Bold');
                headers.forEach((header, idx) => {
                    doc.text(header, xPos + 5, PdfExportService.currentY + 9, {
                        width: columnWidths[idx] - 10,
                        align: 'left'
                    });
                    xPos += columnWidths[idx];
                });
                PdfExportService.currentY += baseRowHeight;
                // Restablecer fuente normal para datos
                doc.fillColor('#333333')
                    .fontSize(9)
                    .font('Helvetica');
            }
            const rowData = [
                this.formatearNombreCompacto(acceso.nombre, acceso.apellidos),
                acceso.area || 'Sin área',
                (acceso.motivo || 'N/A').length > 40
                    ? (acceso.motivo || 'N/A').substring(0, 40) + '...'
                    : (acceso.motivo || 'N/A'),
                new Date(acceso.horaEntrada).toLocaleDateString([], {
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                acceso.horaSalida
                    ? new Date(acceso.horaSalida).toLocaleDateString([], {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                    : 'ACTIVO',
                acceso.filtro?.nombre
                    ? (acceso.filtro.nombre.length > 15
                        ? acceso.filtro.nombre.substring(0, 15) + '...'
                        : acceso.filtro.nombre)
                    : (acceso.filtroId || 'N/A')
            ];
            const alturasCeldas = this.calcularAlturasCeldas(doc, rowData, columnWidths);
            const alturaFila = Math.max(baseRowHeight, Math.max(...alturasCeldas) + 12);
            // Fondo alternado para filas
            if (index % 2 === 0) {
                doc.fillColor('#f8fafc')
                    .rect(50, PdfExportService.currentY, 520, alturaFila)
                    .fill();
            }
            xPos = 50;
            // Asegurar que la fuente sigue siendo normal
            doc.fillColor('#333333')
                .fontSize(9)
                .font('Helvetica');
            rowData.forEach((cell, cellIndex) => {
                const cellX = xPos + 5;
                const cellY = PdfExportService.currentY + 8;
                const cellWidth = columnWidths[cellIndex] - 10;
                const cellHeight = alturaFila - 12;
                doc.text(cell, cellX, cellY, {
                    width: cellWidth,
                    height: cellHeight,
                    align: 'left',
                    lineGap: 4,
                    ellipsis: true
                });
                xPos += columnWidths[cellIndex];
            });
            // Línea divisoria entre filas
            doc.strokeColor('#e2e8f0')
                .lineWidth(0.5)
                .moveTo(50, PdfExportService.currentY + alturaFila)
                .lineTo(570, PdfExportService.currentY + alturaFila)
                .stroke();
            PdfExportService.currentY += alturaFila;
            registrosEnPagina++;
        });
        // Agregar pie de página para la última página de la tabla
        PdfExportService.agregarPiePagina(doc, 'Registros Detallados');
    }
    // ==================== PIE DE PÁGINA ====================
    static agregarPiePagina(doc, seccion) {
        const pieY = 750;
        doc.strokeColor('#cccccc')
            .lineWidth(1)
            .moveTo(50, pieY)
            .lineTo(doc.page.width - 50, pieY)
            .stroke();
        doc.fillColor('#666666')
            .fontSize(9)
            .text(`${seccion} - Página ${PdfExportService.currentPage} - SIGEA - ${new Date().getFullYear()}`, 50, pieY + 10, { align: 'center' });
    }
    // ==================== MÉTODOS AUXILIARES ====================
    static agregarNuevaPagina(doc) {
        doc.addPage();
        PdfExportService.currentPage++;
        PdfExportService.currentY = PdfExportService.contenidoInicioY;
    }
    static agruparPorArea(accesos) {
        return accesos.reduce((acc, acceso) => {
            const area = acceso.area || 'Sin área especificada';
            acc[area] = (acc[area] || 0) + 1;
            return acc;
        }, {});
    }
    static calcularAlturasCeldas(doc, rowData, columnWidths) {
        return rowData.map((cell, index) => {
            if (!cell || cell === 'N/A' || cell === 'Sin área') {
                return 25;
            }
            try {
                const altura = doc.heightOfString(cell, {
                    width: columnWidths[index] - 15,
                    lineGap: 4
                });
                return Math.max(25, altura + 10);
            }
            catch (error) {
                return 25;
            }
        });
    }
    static formatearNombreCompacto(nombre, apellidos) {
        if (!nombre && !apellidos)
            return 'N/A';
        const nombreCorto = nombre ? nombre.split(' ')[0] : '';
        const apellidoCorto = apellidos ? apellidos.split(' ')[0] : '';
        if (nombreCorto && apellidoCorto) {
            return `${nombreCorto} ${apellidoCorto}`;
        }
        else if (nombreCorto) {
            return nombreCorto;
        }
        else if (apellidoCorto) {
            return apellidoCorto;
        }
        return 'N/A';
    }
    static agregarGraficaAreas(doc, accesos) {
        PdfExportService.currentY = PdfExportService.contenidoInicioY + 50;
        const areas = this.agruparPorArea(accesos);
        const topAreas = Object.entries(areas)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6);
        if (topAreas.length === 0) {
            doc.fillColor('#666666')
                .fontSize(9)
                .text('No hay datos suficientes para mostrar la distribución', 50, PdfExportService.currentY, { align: 'center' });
            PdfExportService.currentY += 20;
            // Agregar pie de página para esta página
            PdfExportService.agregarPiePagina(doc, 'Distribución por Áreas');
            return;
        }
        const totalAccesosConArea = accesos.filter(a => a.area).length;
        const maxCount = Math.max(...topAreas.map(([, count]) => count));
        const barWidth = 180;
        const barHeight = 25;
        const espacioVertical = 55;
        const coloresBarras = [
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'
        ];
        const coloresFondo = ['#ffffff', '#f8fafc'];
        doc.fontSize(10);
        topAreas.forEach(([area, count], index) => {
            // Verificar si necesitamos nueva página
            if (PdfExportService.currentY + espacioVertical > 700) {
                // Agregar pie de página para la página actual
                PdfExportService.agregarPiePagina(doc, 'Distribución por Áreas');
                // Crear nueva página
                PdfExportService.agregarNuevaPagina(doc);
                PdfExportService.insertarLogoFijo(doc);
                PdfExportService.currentY = PdfExportService.contenidoInicioY + 50;
                // Continuar con la gráfica sin título adicional
            }
            const barLength = (count / maxCount) * barWidth;
            const porcentaje = totalAccesosConArea > 0
                ? ((count / totalAccesosConArea) * 100).toFixed(1)
                : '0.0';
            let areaTexto = area;
            if (areaTexto.length > 120) {
                areaTexto = areaTexto.substring(0, 120) + '...';
            }
            const colorFondoIndex = index % 2;
            const alturaFila = espacioVertical;
            // Fondo alternado para filas de gráfica
            doc.fillColor(coloresFondo[colorFondoIndex])
                .rect(45, PdfExportService.currentY - 5, 530, alturaFila)
                .fill();
            doc.strokeColor('#e2e8f0')
                .lineWidth(0.5)
                .rect(45, PdfExportService.currentY - 5, 530, alturaFila)
                .stroke();
            doc.fillColor('#666666')
                .fontSize(9)
                .font('Helvetica-Bold')
                .text(`${index + 1}.`, 50, PdfExportService.currentY + 10);
            doc.fillColor('#333333')
                .fontSize(10)
                .font('Helvetica')
                .text(areaTexto, 65, PdfExportService.currentY + 10, {
                width: 200,
                lineGap: 3
            });
            const colorBarra = coloresBarras[index % coloresBarras.length];
            const barY = PdfExportService.currentY + 8;
            // Barra de progreso
            doc.fillColor(colorBarra)
                .rect(275, barY, barLength, barHeight)
                .fill();
            doc.strokeColor('#1e40af')
                .lineWidth(0.5)
                .rect(275, barY, barLength, barHeight)
                .stroke();
            const etiqueta = `${count} (${porcentaje}%)`;
            doc.fillColor('#333333')
                .fontSize(10)
                .font('Helvetica-Bold')
                .text(etiqueta, 280 + barLength, PdfExportService.currentY + 15);
            PdfExportService.currentY += espacioVertical;
        });
        PdfExportService.currentY += 20;
        // Información adicional si hay espacio
        if (PdfExportService.currentY < 680) {
            const totalSinArea = accesos.length - totalAccesosConArea;
            doc.fillColor('#666666')
                .fontSize(9)
                .font('Helvetica')
                .text(`* Basado en ${totalAccesosConArea} accesos con área especificada`, 50, PdfExportService.currentY);
            PdfExportService.currentY += 10;
            doc.fillColor('#666666')
                .fontSize(9)
                .font('Helvetica')
                .text(`* ${totalSinArea} accesos sin área especificada no incluidos`, 50, PdfExportService.currentY);
        }
        // Agregar pie de página para la última página de la gráfica
        PdfExportService.agregarPiePagina(doc, 'Distribución por Áreas');
    }
    static agregarMensajeSinDatos(doc) {
        PdfExportService.currentY = PdfExportService.contenidoInicioY + 110;
        doc.fillColor('#666666')
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('No se encontraron registros de acceso', 50, PdfExportService.currentY, { align: 'center' });
        PdfExportService.currentY += 25;
        doc.fillColor('#666666')
            .fontSize(9)
            .text('Para el período seleccionado no hay accesos registrados en el sistema.', 50, PdfExportService.currentY, { align: 'center' });
    }
    // ==================== MANEJO DE ARCHIVOS TEMPORALES ====================
    static archivosTemporales = [];
    static guardarBase64ComoArchivoTemporal(base64String) {
        try {
            const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (!matches || matches.length !== 3) {
                throw new Error('Formato base64 inválido');
            }
            const extension = matches[1].split('/')[1];
            const data = matches[2];
            const tempDir = path_1.default.join(process.cwd(), 'temp');
            if (!fs_1.default.existsSync(tempDir)) {
                fs_1.default.mkdirSync(tempDir, { recursive: true });
            }
            const nombreTemporal = `logo_temp_${Date.now()}.${extension}`;
            const rutaTemporal = path_1.default.join(tempDir, nombreTemporal);
            fs_1.default.writeFileSync(rutaTemporal, data, 'base64');
            this.archivosTemporales.push(rutaTemporal);
            return rutaTemporal;
        }
        catch (error) {
            console.warn('⚠️ Error al guardar base64 como archivo temporal:', error);
            return '';
        }
    }
    static limpiarArchivosTemporales() {
        this.archivosTemporales.forEach(ruta => {
            try {
                if (fs_1.default.existsSync(ruta)) {
                    fs_1.default.unlinkSync(ruta);
                }
            }
            catch (error) {
                console.warn(`⚠️ No se pudo eliminar archivo temporal: ${ruta}`, error);
            }
        });
        this.archivosTemporales = [];
    }
}
exports.PdfExportService = PdfExportService;
//# sourceMappingURL=PdfExportService.js.map