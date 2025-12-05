import PDFDocument from 'pdfkit';
import { ExportacionResultado, DatosExportacion } from '../../types/exportacion.types';

export class PdfExportService {
  private static currentY: number = 0;
  private static currentPage: number = 1;
  private static totalPages: number = 1;
  private static datosReporte: DatosExportacion | null = null;

  static async generarReporte(datos: DatosExportacion): Promise<ExportacionResultado> {
    return new Promise<ExportacionResultado>((resolve, reject) => {
      try {
        const { accesos, inicio, fin, usuario } = datos;

        console.log('📄 PDF Service - Datos recibidos:', {
        totalAccesos: accesos.length,
        fechaInicio: inicio,
        fechaFin: fin,
        usuario: usuario?.nombre || usuario?.email,
        tieneDatos: accesos.length > 0
      });

      // Si hay datos, mostrar primeros 3 para verificar
      if (accesos.length > 0) {
        console.log('📄 Primeros 3 accesos:', accesos.slice(0, 3).map(a => ({
          id: a.id,
          nombre: a.nombre,
          apellidos: a.apellidos,
          registradoPor: a.registradoPor,
          motivo: a.motivo
        })));
      }

        PdfExportService.datosReporte = datos;

        const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
        const buffers: Buffer[] = [];

        PdfExportService.currentY = 50;
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

        PdfExportService.agregarEncabezadoPrincipal(doc);
        PdfExportService.agregarEstadisticasGenerales(doc, accesos);
        PdfExportService.agregarPiePagina(doc, 'Información General');

        if (accesos.length > 0) {
          PdfExportService.agregarNuevaPagina(doc);
          PdfExportService.agregarEncabezadoSecundario(doc, 'Registros de Acceso Detallados');
          PdfExportService.agregarTablaAccesos(doc, accesos);
          PdfExportService.agregarPiePagina(doc, 'Registros Detallados');

          PdfExportService.agregarNuevaPagina(doc);
          PdfExportService.agregarEncabezadoSecundario(doc, 'Distribución por Áreas');
          PdfExportService.agregarGraficaAreas(doc, accesos);
          PdfExportService.agregarPiePagina(doc, 'Distribución por Áreas');
        } else {
          PdfExportService.agregarNuevaPagina(doc);
          PdfExportService.agregarEncabezadoSecundario(doc, 'Sin Registros');
          PdfExportService.agregarMensajeSinDatos(doc);
          PdfExportService.agregarPiePagina(doc, 'Sin Registros');
        }

        PdfExportService.totalPages = PdfExportService.currentPage;

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  // ENCABEZADO PRINCIPAL (Página 1)
  private static agregarEncabezadoPrincipal(doc: PDFKit.PDFDocument): void {
    if (!PdfExportService.datosReporte) return;

    const { inicio, fin, usuario } = PdfExportService.datosReporte;
    const nombreUsuario = usuario && usuario.nombre && usuario.apellidos
      ? `${usuario.nombre} ${usuario.apellidos}`
      : (usuario?.nombre || usuario?.email || 'Usuario no disponible');

    doc.fillColor('#1e40af')
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('SIGEA - REPORTE DE ACCESOS', 40, PdfExportService.currentY, { align: 'center' });

    PdfExportService.currentY += 30;

    doc.fillColor('#666666')
      .fontSize(12)
      .font('Helvetica')
      .text(`Período: ${inicio.toLocaleDateString()} - ${fin.toLocaleDateString()}`, 50, PdfExportService.currentY, { align: 'center' });

    PdfExportService.currentY += 15;

    doc.fillColor('#666666')
      .fontSize(12)
      .font('Helvetica')
      .text(`Generado por: ${nombreUsuario}`, 50, PdfExportService.currentY, { align: 'center' });

    PdfExportService.currentY += 15;

    doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 50, PdfExportService.currentY, { align: 'center' });

    PdfExportService.currentY += 30;

  }

  // ESTADÍSTICAS GENERALES (Página 1)
  private static agregarEstadisticasGenerales(doc: PDFKit.PDFDocument, accesos: any[]): void {
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
      .fontSize(11)
      .font('Helvetica')
      .text(stats.join('\n'), 50, PdfExportService.currentY, { lineGap: 8 });

    PdfExportService.currentY += stats.length * 20 + 30;
  }

  // TABLA DE ACCESOS OPTIMIZADA - COLUMNAS MÁS COMPACTAS
  private static agregarTablaAccesos(doc: PDFKit.PDFDocument, accesos: any[]): void {
    PdfExportService.currentY = 100;

    // OPTIMIZADO: Anchos de columna más compactos pero funcionales
    const columnWidths = [70, 130, 100, 75, 75, 70]; // Total: 520px
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

    // Datos de la tabla
    doc.fillColor('#333333')
      .fontSize(8)
      .font('Helvetica');

    let registrosEnPagina = 0;
    const maxRegistrosPorPagina = 15;

    accesos.forEach((acceso, index) => {
      // Verificar si necesitamos nueva página
      if (registrosEnPagina >= maxRegistrosPorPagina) {
        PdfExportService.agregarNuevaPagina(doc);
        PdfExportService.agregarEncabezadoSecundario(doc, 'Registros de Acceso - Continuación');
        PdfExportService.currentY = 100;
        registrosEnPagina = 0;

        // Redibujar encabezado de tabla
        doc.fillColor('#1e40af')
          .rect(50, PdfExportService.currentY, 520, baseRowHeight)
          .fill();

        xPos = 50;
        doc.fillColor('#ffffff')
          .fontSize(9)
          .font('Helvetica-Bold');

        headers.forEach((header, idx) => {
          doc.text(header, xPos + 5, PdfExportService.currentY + 9, {
            width: columnWidths[idx] - 10,
            align: 'left'
          });
          xPos += columnWidths[idx];
        });

        PdfExportService.currentY += baseRowHeight;
      }

      // OPTIMIZADO: Datos formateados para columnas compactas
      const rowData = [
        // Nombre: Solo primeras letras de nombre y primer apellido
        this.formatearNombreCompacto(acceso.nombre, acceso.apellidos),
        // Área: Mostrar completa pero en múltiples líneas
        acceso.area || 'Sin área',
        // Motivo: Truncado a 40 caracteres
        (acceso.motivo || 'N/A').length > 40
          ? (acceso.motivo || 'N/A').substring(0, 40) + '...'
          : (acceso.motivo || 'N/A'),
        // Entrada: Formato compacto
        new Date(acceso.horaEntrada).toLocaleDateString([], {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        // Salida: Formato compacto
        acceso.horaSalida
          ? new Date(acceso.horaSalida).toLocaleDateString([], {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
          : 'ACTIVO',
        // Filtro: Nombre corto o ID
        acceso.filtro?.nombre
          ? (acceso.filtro.nombre.length > 15
            ? acceso.filtro.nombre.substring(0, 15) + '...'
            : acceso.filtro.nombre)
          : (acceso.filtroId || 'N/A')
      ];

      // Calcular altura de fila dinámicamente
      const alturasCeldas = this.calcularAlturasCeldas(doc, rowData, columnWidths);
      const alturaFila = Math.max(baseRowHeight, Math.max(...alturasCeldas) + 12);

      // Fondo alternado para filas
      if (index % 2 === 0) {
        doc.fillColor('#f8fafc')
          .rect(50, PdfExportService.currentY, 520, alturaFila)
          .fill();
      }

      xPos = 50;
      doc.fillColor('#333333')
        .fontSize(8);

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

      // Línea separadora
      doc.strokeColor('#e2e8f0')
        .lineWidth(0.5)
        .moveTo(50, PdfExportService.currentY + alturaFila)
        .lineTo(570, PdfExportService.currentY + alturaFila)
        .stroke();

      PdfExportService.currentY += alturaFila;
      registrosEnPagina++;

      // Verificar si necesitamos nueva página por espacio
      if (PdfExportService.currentY > 650 && index < accesos.length - 1) {
        PdfExportService.agregarNuevaPagina(doc);
        PdfExportService.agregarEncabezadoSecundario(doc, 'Registros de Acceso - Continuación');
        PdfExportService.currentY = 100;
        registrosEnPagina = 0;

        // Redibujar encabezado de tabla
        doc.fillColor('#1e40af')
          .rect(50, PdfExportService.currentY, 520, baseRowHeight)
          .fill();

        xPos = 50;
        doc.fillColor('#ffffff')
          .fontSize(9)
          .font('Helvetica-Bold');

        headers.forEach((header, idx) => {
          doc.text(header, xPos + 5, PdfExportService.currentY + 9, {
            width: columnWidths[idx] - 10,
            align: 'left'
          });
          xPos += columnWidths[idx];
        });

        PdfExportService.currentY += baseRowHeight;
      }
    });
  }

  // GRÁFICA DE ÁREAS CON INFORMACIÓN COMPLETA
  private static agregarGraficaAreas(doc: PDFKit.PDFDocument, accesos: any[]): void {
    PdfExportService.currentY = 100;

    const areas = this.agruparPorArea(accesos);
    const topAreas = Object.entries(areas)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 6); // REDUCIDO a 6 áreas para mostrar información completa

    if (topAreas.length === 0) {
      doc.fillColor('#666666')
        .fontSize(10)
        .text('No hay datos suficientes para mostrar la distribución', 50, PdfExportService.currentY, { align: 'center' });
      PdfExportService.currentY += 20;
      return;
    }

    const totalAccesosConArea = accesos.filter(a => a.area).length;
    const maxCount = Math.max(...topAreas.map(([, count]) => count as number));
    const barWidth = 180; // AJUSTADO para dar más espacio al texto
    const barHeight = 25;
    const espacioVertical = 55; // AUMENTADO para áreas largas

    // Colores para las barras
    const coloresBarras = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'
    ];

    // Colores de fondo alternados
    const coloresFondo = ['#ffffff', '#f8fafc'];

    doc.fontSize(9);

    topAreas.forEach(([area, count], index) => {
      // Verificar espacio disponible
      if (PdfExportService.currentY + espacioVertical > 700) {
        PdfExportService.agregarNuevaPagina(doc);
        PdfExportService.agregarEncabezadoSecundario(doc, 'Distribución por Áreas - Continuación');
        PdfExportService.currentY = 100;

        doc.fillColor('#1e40af')
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('DISTRIBUCIÓN POR ÁREAS (CONTINUACIÓN)', 50, PdfExportService.currentY, { align: 'center' });
        PdfExportService.currentY += 40;
      }

      const barLength = (count as number / maxCount) * barWidth;
      const porcentaje = totalAccesosConArea > 0
        ? ((count as number / totalAccesosConArea) * 100).toFixed(1)
        : '0.0';

      // MOSTRAR ÁREA COMPLETA (hasta 120 caracteres)
      let areaTexto = area;
      // Permitir hasta 120 caracteres completos
      if (areaTexto.length > 120) {
        areaTexto = areaTexto.substring(0, 120) + '...';
      }

      // Fondo alternado para la fila
      const colorFondoIndex = index % 2;
      const alturaFila = espacioVertical;

      doc.fillColor(coloresFondo[colorFondoIndex])
        .rect(45, PdfExportService.currentY - 5, 530, alturaFila)
        .fill();

      // Borde sutil
      doc.strokeColor('#e2e8f0')
        .lineWidth(0.5)
        .rect(45, PdfExportService.currentY - 5, 530, alturaFila)
        .stroke();

      // Número de posición
      doc.fillColor('#666666')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(`${index + 1}.`, 50, PdfExportService.currentY + 10);

      // ÁREA COMPLETA con más espacio (200px de ancho)
      doc.fillColor('#333333')
        .fontSize(9)
        .font('Helvetica')
        .text(areaTexto, 65, PdfExportService.currentY + 10, {
          width: 200, // AUMENTADO para mostrar área completa
          lineGap: 3
        });

      // Barra de distribución
      const colorBarra = coloresBarras[index % coloresBarras.length];
      const barY = PdfExportService.currentY + 8;

      doc.fillColor(colorBarra)
        .rect(275, barY, barLength, barHeight) // MOVIDO a la derecha para dar espacio al texto
        .fill();

      doc.strokeColor('#1e40af')
        .lineWidth(0.5)
        .rect(275, barY, barLength, barHeight)
        .stroke();

      // Etiqueta con count y porcentaje
      const etiqueta = `${count} (${porcentaje}%)`;
      doc.fillColor('#333333')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(etiqueta, 280 + barLength, PdfExportService.currentY + 15);

      PdfExportService.currentY += espacioVertical;
    });

    PdfExportService.currentY += 20;

    // Leyenda informativa
    if (PdfExportService.currentY < 680) {
      const totalSinArea = accesos.length - totalAccesosConArea;

      doc.fillColor('#666666')
        .fontSize(8)
        .font('Helvetica')
        .text(`* Basado en ${totalAccesosConArea} accesos con área especificada`, 50, PdfExportService.currentY);

      PdfExportService.currentY += 10;

      doc.fillColor('#666666')
        .fontSize(8)
        .font('Helvetica')
        .text(`* ${totalSinArea} accesos sin área especificada no incluidos`, 50, PdfExportService.currentY);
    }
  }
  private static agregarEncabezadoSecundario(doc: PDFKit.PDFDocument, titulo: string): void {
    if (!PdfExportService.datosReporte) return;

    const { inicio, fin } = PdfExportService.datosReporte;

    PdfExportService.currentY = 50;

    doc.fillColor('#1e40af')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(titulo, 50, PdfExportService.currentY, { align: 'center' });

    PdfExportService.currentY += 25;
  }

  private static agregarMensajeSinDatos(doc: PDFKit.PDFDocument): void {
    PdfExportService.currentY = 200;

    doc.fillColor('#666666')
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('No se encontraron registros de acceso', 50, PdfExportService.currentY, { align: 'center' });

    PdfExportService.currentY += 25;

    doc.fillColor('#666666')
      .fontSize(11)
      .text('Para el período seleccionado no hay accesos registrados en el sistema.', 50, PdfExportService.currentY, { align: 'center' });
  }

  // PIE DE PÁGINA
  private static agregarPiePagina(doc: PDFKit.PDFDocument, seccion: string): void {
    const pieY = 750;

    doc.strokeColor('#cccccc')
      .lineWidth(1)
      .moveTo(50, pieY)
      .lineTo(doc.page.width - 50, pieY)
      .stroke();

    doc.fillColor('#666666')
      .fontSize(8)
      .text(
        `${seccion} - Página ${PdfExportService.currentPage} - SIGEA - ${new Date().getFullYear()}`,
        50,
        pieY + 10,
        { align: 'center' }
      );
  }

  // MÉTODOS AUXILIARES
  private static agregarNuevaPagina(doc: PDFKit.PDFDocument): void {
    doc.addPage();
    PdfExportService.currentPage++;
    PdfExportService.currentY = 50;
  }

  private static agruparPorArea(accesos: any[]): Record<string, number> {
    return accesos.reduce((acc: Record<string, number>, acceso) => {
      const area = acceso.area || 'Sin área especificada';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});
  }

  private static calcularAlturasCeldas(doc: PDFKit.PDFDocument, rowData: string[], columnWidths: number[]): number[] {
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
      } catch (error) {
        return 25;
      }
    });
  }

  private static formatearNombreCompacto(nombre: string | null, apellidos: string | null): string {
    if (!nombre && !apellidos) return 'N/A';

    const nombreCorto = nombre ? nombre.split(' ')[0] : '';
    const apellidoCorto = apellidos ? apellidos.split(' ')[0] : '';

    if (nombreCorto && apellidoCorto) {
      return `${nombreCorto} ${apellidoCorto}`;
    } else if (nombreCorto) {
      return nombreCorto;
    } else if (apellidoCorto) {
      return apellidoCorto;
    }

    return 'N/A';
  }
}