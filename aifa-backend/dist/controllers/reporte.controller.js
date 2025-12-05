"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReporteController = void 0;
const data_1 = require("../data");
const exportacion_1 = require("../services/exportacion");
class ReporteController {
    static getReporteGlobal = async (req, res) => {
        try {
            const { fechaInicio, fechaFin, incluirEstadisticas = 'true', filtroId, usuarioId } = req.query;
            if (!fechaInicio || !fechaFin) {
                return res.status(400).json({
                    error: 'Los parámetros fechaInicio y fechaFin son requeridos'
                });
            }
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            fin.setHours(23, 59, 59, 999);
            if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
                return res.status(400).json({ error: 'Formato de fecha inválido' });
            }
            if (inicio > fin) {
                return res.status(400).json({
                    error: 'La fecha de inicio no puede ser mayor a la fecha fin'
                });
            }
            console.log(`📊 Generando reporte del ${inicio.toISOString()} al ${fin.toISOString()}`);
            // Construir where clause para accesos
            const whereAccesos = {
                fechaCreacion: {
                    gte: inicio,
                    lte: fin
                }
            };
            // Si hay filtroId, agregarlo al where
            if (filtroId && filtroId !== '') {
                whereAccesos.filtroId = Number(filtroId);
                console.log(`🚪 Filtrando por filtro ID: ${filtroId}`);
            }
            // Si hay usuarioId, agregarlo al where
            if (usuarioId && usuarioId !== '') {
                whereAccesos.creadoPor = Number(usuarioId);
                console.log(`👤 Filtrando por usuario ID: ${usuarioId}`);
            }
            const [accesos, turnos, usuarios, totalFiltros] = await Promise.all([
                data_1.prisma.acceso.findMany({
                    where: whereAccesos,
                    include: {
                        creador: {
                            select: {
                                id: true,
                                nombre: true,
                                apellidos: true,
                                email: true
                            }
                        },
                        turno: {
                            select: {
                                id: true,
                                nombreTurno: true,
                                horaInicio: true
                            }
                        },
                        identificacion: {
                            select: {
                                id: true,
                                tipo: true,
                                numero: true
                            }
                        },
                        filtro: {
                            select: {
                                id: true,
                                nombre: true,
                                descripcion: true,
                                ubicacion: true
                            }
                        }
                    },
                    orderBy: { fechaCreacion: 'desc' }
                }),
                data_1.prisma.turno.findMany({
                    where: { estaActivo: true },
                    include: {
                        creador: {
                            select: { nombre: true, apellidos: true }
                        },
                        usuarios: {
                            include: {
                                usuario: {
                                    select: {
                                        id: true,
                                        nombre: true,
                                        apellidos: true,
                                        email: true
                                    }
                                }
                            }
                        },
                        _count: {
                            select: { accesos: true }
                        }
                    }
                }),
                data_1.prisma.usuario.findMany({
                    where: { estaActivo: true },
                    select: {
                        id: true,
                        email: true,
                        nombre: true,
                        apellidos: true,
                        rol: true,
                        telefono: true,
                        fechaCreacion: true,
                        filtroAsignado: {
                            select: {
                                id: true,
                                nombre: true
                            }
                        },
                        _count: {
                            select: {
                                accesos: true,
                                turnosCreados: true,
                                turnosAsignados: true
                            }
                        }
                    }
                }),
                data_1.prisma.filtro.count({
                    where: { estaActivo: true }
                })
            ]);
            // Calcular estadísticas
            const diasPeriodo = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const estadisticas = {
                totalAccesos: accesos.length,
                accesosActivos: accesos.filter(a => !a.horaSalida).length,
                identificacionesRetenidas: accesos.filter(a => a.identificacionId).length,
                conAcompanante: accesos.filter(a => a.tieneAcompanante).length,
                accesosConFiltro: accesos.filter(a => a.filtroId).length,
                totalTurnos: turnos.length,
                turnosActivos: turnos.filter(t => t.estaActivo).length,
                usuariosActivos: usuarios.length,
                totalFiltros: totalFiltros,
                promedioDiario: diasPeriodo > 0 ? Math.round(accesos.length / diasPeriodo) : 0,
                tasaCompletitud: accesos.length > 0 ?
                    ((accesos.length - accesos.filter(a => !a.horaSalida).length) / accesos.length * 100) : 0,
                tasaIdentificacion: accesos.length > 0 ?
                    (accesos.filter(a => a.identificacionId).length / accesos.length * 100) : 0,
                tasaAcompanante: accesos.length > 0 ?
                    (accesos.filter(a => a.tieneAcompanante).length / accesos.length * 100) : 0,
                diasPeriodo,
                fechaInicio: inicio,
                fechaFin: fin
            };
            // Agrupar datos
            const agrupaciones = {
                porArea: ReporteController.agruparPorArea(accesos),
                porMotivo: ReporteController.agruparPorMotivo(accesos),
                porFiltro: ReporteController.agruparPorFiltro(accesos),
                porTurno: ReporteController.agruparPorTurno(accesos),
                porCreador: ReporteController.agruparPorCreador(accesos),
                porDia: ReporteController.agruparPorDia(accesos, inicio, fin)
            };
            const response = {
                success: true,
                datos: {
                    accesos: incluirEstadisticas === 'true' ? accesos : [],
                    turnos: incluirEstadisticas === 'true' ? turnos : [],
                    usuarios: incluirEstadisticas === 'true' ? usuarios : []
                },
                estadisticas,
                agrupaciones,
                metadata: {
                    fechaGeneracion: new Date(),
                    periodo: `${inicio.toLocaleDateString()} - ${fin.toLocaleDateString()}`,
                    totalRegistros: accesos.length,
                    filtroAplicado: filtroId ? Number(filtroId) : null,
                    usuarioAplicado: usuarioId ? Number(usuarioId) : null
                }
            };
            res.json(response);
        }
        catch (error) {
            console.error('Error en reporte global:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor al generar el reporte'
            });
        }
    };
    static exportarReporte = async (req, res) => {
        try {
            const { formato, fechaInicio, fechaFin, tipoReporte = 'global', filtroId, usuarioId, registradoPor } = req.body;
            const usuario = req.user;
            // Validaciones
            if (!fechaInicio || !fechaFin) {
                return res.status(400).json({
                    success: false,
                    error: 'fechaInicio y fechaFin son requeridos'
                });
            }
            if (!['pdf', 'excel', 'csv'].includes(formato)) {
                return res.status(400).json({
                    success: false,
                    error: 'Formato no soportado. Use: pdf, excel o csv'
                });
            }
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            fin.setHours(23, 59, 59, 999);
            // DEBUG: Ver qué filtros están llegando
            console.log('🔍 Filtros recibidos en exportarReporte:', {
                filtroId,
                usuarioId,
                registradoPor,
                usuarioIdEsTodos: usuarioId === 'todos',
                fechaInicio: inicio,
                fechaFin: fin
            });
            // Construir where clause para accesos - INICIAR VACÍO
            const whereAccesos = {
                fechaCreacion: {
                    gte: inicio,
                    lte: fin
                }
            };
            // IMPORTANTE: Primero verificar registradoPor
            if (registradoPor && registradoPor.trim() !== '' && registradoPor !== 'todos') {
                // Solo filtrar por registradoPor
                whereAccesos.registradoPor = {
                    contains: registradoPor.trim()
                };
                console.log(`📝 Exportando SOLO con registradoPor: "${registradoPor}"`);
                // NO usar usuarioId cuando se filtra por registradoPor
                // porque son criterios diferentes
            }
            // Solo si NO hay registradoPor, usar usuarioId (creadoPor)
            else if (usuarioId && usuarioId !== '' && usuarioId !== 'todos') {
                whereAccesos.creadoPor = Number(usuarioId);
                console.log(`👤 Exportando con usuario ID (creadoPor): ${usuarioId}`);
            }
            // FILTRAR POR FILTRO ID SI SE ESPECIFICA (opcional adicional)
            if (filtroId && filtroId !== '' && filtroId !== 'todos') {
                whereAccesos.filtroId = Number(filtroId);
                console.log(`🚪 Exportando con filtro ID: ${filtroId}`);
            }
            console.log('🔍 Where clause final:', JSON.stringify(whereAccesos, null, 2));
            // Obtener datos CON FILTROS APLICADOS
            const accesos = await data_1.prisma.acceso.findMany({
                where: whereAccesos,
                include: {
                    creador: {
                        select: {
                            nombre: true,
                            apellidos: true,
                            email: true
                        }
                    },
                    turno: {
                        select: {
                            nombreTurno: true
                        }
                    },
                    identificacion: {
                        select: {
                            tipo: true,
                            numero: true
                        }
                    },
                    filtro: {
                        select: {
                            id: true,
                            nombre: true,
                            descripcion: true,
                            ubicacion: true
                        }
                    }
                },
                orderBy: { fechaCreacion: 'desc' }
            });
            // DEBUG CRÍTICO: Ver qué se obtuvo
            console.log('Resultado de la consulta:', {
                totalAccesos: accesos.length,
                primerosRegistros: accesos.slice(0, 3).map(a => ({
                    id: a.id,
                    nombre: a.nombre,
                    apellidos: a.apellidos,
                    registradoPor: a.registradoPor,
                    creadoPor: a.creadoPor,
                    motivo: a.motivo
                })),
                filtroUsado: registradoPor ? 'registradoPor' : (usuarioId ? 'creadoPor' : 'ninguno'),
                valorFiltro: registradoPor || usuarioId
            });
            if (accesos.length === 0) {
                console.log('⚠️ ADVERTENCIA: No se encontraron accesos con los filtros aplicados');
                console.log('⚠️ Verificar si hay datos en la base de datos para este período');
                // Obtener conteo total sin filtros para debug
                const totalAccesosPeriodo = await data_1.prisma.acceso.count({
                    where: {
                        fechaCreacion: {
                            gte: inicio,
                            lte: fin
                        }
                    }
                });
                console.log('ℹ️ Total de accesos en el período (sin filtros):', totalAccesosPeriodo);
            }
            // Obtener información del filtro si existe
            let infoFiltro = null;
            if (filtroId && filtroId !== '' && filtroId !== 'todos') {
                try {
                    infoFiltro = await data_1.prisma.filtro.findUnique({
                        where: { id: Number(filtroId) },
                        select: {
                            id: true,
                            nombre: true,
                            descripcion: true,
                            ubicacion: true,
                            estaActivo: true
                        }
                    });
                    console.log(`ℹ️ Información del filtro:`, infoFiltro);
                }
                catch (error) {
                    console.error('❌ Error obteniendo información del filtro:', error);
                }
            }
            // Obtener información del usuario si se especifica (por ID)
            let infoUsuario = null;
            if (usuarioId && usuarioId !== '' && usuarioId !== 'todos' && !registradoPor) {
                try {
                    infoUsuario = await data_1.prisma.usuario.findUnique({
                        where: { id: Number(usuarioId) },
                        select: {
                            id: true,
                            nombre: true,
                            apellidos: true,
                            email: true,
                            rol: true,
                            estaActivo: true
                        }
                    });
                    console.log(`ℹ️ Información del usuario (por ID):`, infoUsuario);
                }
                catch (error) {
                    console.error('❌ Error obteniendo información del usuario:', error);
                }
            }
            // Determinar el tipo de reporte basado en los filtros
            let tipoReporteFinal = tipoReporte;
            if (filtroId && filtroId !== 'todos')
                tipoReporteFinal = 'por-filtro';
            if (usuarioId && usuarioId !== 'todos' && !registradoPor)
                tipoReporteFinal = 'por-usuario';
            if (registradoPor && registradoPor !== 'todos')
                tipoReporteFinal = 'por-registrador';
            const datosExportacion = {
                accesos,
                inicio,
                fin,
                usuario,
                filtro: infoFiltro,
                usuarioInfo: infoUsuario,
                tipoReporte: tipoReporteFinal,
                ...(registradoPor && registradoPor !== 'todos' && { registradoPor })
            };
            let resultado;
            // Usar los servicios de exportación
            switch (formato) {
                case 'pdf':
                    resultado = await exportacion_1.PdfExportService.generarReporte(datosExportacion);
                    break;
                case 'excel':
                    resultado = await exportacion_1.ExcelExportService.generarReporte(datosExportacion);
                    break;
                case 'csv':
                    resultado = await exportacion_1.CsvExportService.generarReporte(datosExportacion);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        error: 'Formato no implementado'
                    });
            }
            // Registrar en backup logs
            await data_1.prisma.backupLog.create({
                data: {
                    tipo: 'EXPORTACION_REPORTE',
                    descripcion: `Reporte ${formato.toUpperCase()} - ${fechaInicio} a ${fechaFin}${filtroId && filtroId !== 'todos' ? ` - Filtro: ${infoFiltro?.nombre || filtroId}` : ''}${usuarioId && usuarioId !== 'todos' && !registradoPor ? ` - Usuario: ${infoUsuario?.nombre || usuarioId}` : ''}${registradoPor && registradoPor !== 'todos' ? ` - Registrador: ${registradoPor}` : ''}`,
                    usuarioId: usuario.id,
                    detalles: {
                        formato,
                        fechaInicio,
                        fechaFin,
                        totalRegistros: accesos.length,
                        tipoReporte: tipoReporteFinal,
                        filtroNombre: infoFiltro?.nombre || null,
                        usuarioId: usuarioId && usuarioId !== 'todos' && !registradoPor ? usuarioId : null,
                        usuarioNombre: infoUsuario ? `${infoUsuario.nombre} ${infoUsuario.apellidos}` : null,
                        registradoPor: registradoPor && registradoPor !== 'todos' ? registradoPor : null,
                        fileName: resultado.fileName
                    }
                }
            });
            const fechaInicioMX = inicio.toLocaleDateString('es-MX');
            const fechaFinMX = fin.toLocaleDateString('es-MX');
            await data_1.prisma.auditoria.create({
                data: {
                    tipo: 'REPORTE',
                    accion: 'EXPORTACION_REPORTE',
                    descripcion: `Reporte exportado en formato ${formato} del ${fechaInicioMX} al ${fechaFinMX}${registradoPor && registradoPor !== 'todos' ? ` - Registrador: ${registradoPor}` : ''}`,
                    usuarioId: usuario.id,
                    filtroId: usuario.filtroAsignadoId || null
                }
            });
            console.log(`✅ Reporte exportado: ${resultado.fileName}`);
            // Enviar archivo
            res.setHeader('Content-Type', resultado.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${resultado.fileName}"`);
            res.setHeader('Content-Length', resultado.buffer.length);
            res.send(resultado.buffer);
        }
        catch (error) {
            console.error('❌ Error exportando reporte:', error);
            res.status(500).json({
                success: false,
                error: 'Error al exportar el reporte'
            });
        }
    };
    // MÉTODOS AUXILIARES PARA AGRUPACIONES
    static agruparPorArea(accesos) {
        return accesos.reduce((acc, acceso) => {
            const area = acceso.area || 'Sin área especificada';
            acc[area] = (acc[area] || 0) + 1;
            return acc;
        }, {});
    }
    static agruparPorMotivo(accesos) {
        return accesos.reduce((acc, acceso) => {
            const motivo = acceso.motivo || 'Sin motivo especificado';
            acc[motivo] = (acc[motivo] || 0) + 1;
            return acc;
        }, {});
    }
    static agruparPorFiltro(accesos) {
        return accesos.reduce((acc, acceso) => {
            const filtroNombre = acceso.filtro?.nombre || 'Sin filtro asignado';
            acc[filtroNombre] = (acc[filtroNombre] || 0) + 1;
            return acc;
        }, {});
    }
    static agruparPorTurno(accesos) {
        return accesos.reduce((acc, acceso) => {
            const turnoNombre = acceso.turno?.nombreTurno || 'Sin turno asignado';
            acc[turnoNombre] = (acc[turnoNombre] || 0) + 1;
            return acc;
        }, {});
    }
    static agruparPorCreador(accesos) {
        return accesos.reduce((acc, acceso) => {
            const creador = `${acceso.creador.nombre} ${acceso.creador.apellidos}`;
            acc[creador] = (acc[creador] || 0) + 1;
            return acc;
        }, {});
    }
    static agruparPorDia(accesos, inicio, fin) {
        const resultado = {};
        const currentDate = new Date(inicio);
        while (currentDate <= fin) {
            const fechaStr = currentDate.toISOString().split('T')[0];
            resultado[fechaStr] = 0;
            currentDate.setDate(currentDate.getDate() + 1);
        }
        accesos.forEach(acceso => {
            const fechaAcceso = new Date(acceso.horaEntrada).toISOString().split('T')[0];
            if (resultado[fechaAcceso] !== undefined) {
                resultado[fechaAcceso]++;
            }
        });
        return resultado;
    }
    static getReportePorFiltro = async (req, res) => {
        try {
            const { filtroId } = req.params;
            const { fechaInicio, fechaFin } = req.query;
            if (!fechaInicio || !fechaFin) {
                return res.status(400).json({
                    error: 'Los parámetros fechaInicio y fechaFin son requeridos'
                });
            }
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            fin.setHours(23, 59, 59, 999);
            // Verificar que el filtro existe
            const filtro = await data_1.prisma.filtro.findUnique({
                where: { id: Number(filtroId) },
                select: {
                    id: true,
                    nombre: true,
                    descripcion: true,
                    ubicacion: true,
                    estaActivo: true
                }
            });
            if (!filtro) {
                return res.status(404).json({
                    success: false,
                    error: 'Filtro no encontrado'
                });
            }
            if (!filtro.estaActivo) {
                return res.status(400).json({
                    success: false,
                    error: 'El filtro está inactivo'
                });
            }
            const accesos = await data_1.prisma.acceso.findMany({
                where: {
                    filtroId: Number(filtroId),
                    fechaCreacion: {
                        gte: inicio,
                        lte: fin
                    }
                },
                include: {
                    creador: {
                        select: {
                            nombre: true,
                            apellidos: true,
                            email: true
                        }
                    },
                    turno: {
                        select: {
                            nombreTurno: true
                        }
                    },
                    identificacion: {
                        select: {
                            tipo: true,
                            numero: true
                        }
                    },
                    filtro: {
                        select: {
                            nombre: true,
                            descripcion: true
                        }
                    }
                },
                orderBy: { fechaCreacion: 'desc' }
            });
            const estadisticas = {
                totalAccesos: accesos.length,
                accesosActivos: accesos.filter(a => !a.horaSalida).length,
                conIdentificacion: accesos.filter(a => a.identificacionId).length,
                conAcompanante: accesos.filter(a => a.tieneAcompanante).length,
                promedioDiario: Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) > 0 ?
                    Math.round(accesos.length / (Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1)) : 0
            };
            // Agrupar datos
            const agrupaciones = {
                porArea: ReporteController.agruparPorArea(accesos),
                porMotivo: ReporteController.agruparPorMotivo(accesos),
                porTurno: ReporteController.agruparPorTurno(accesos),
                porDia: ReporteController.agruparPorDia(accesos, inicio, fin)
            };
            res.json({
                success: true,
                datos: {
                    accesos,
                    filtro
                },
                estadisticas,
                agrupaciones,
                metadata: {
                    fechaGeneracion: new Date(),
                    periodo: `${inicio.toLocaleDateString()} - ${fin.toLocaleDateString()}`,
                    totalRegistros: accesos.length,
                    filtro: filtro.nombre
                }
            });
        }
        catch (error) {
            console.error('❌ Error en reporte por filtro:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };
    static getReportePorUsuario = async (req, res) => {
        try {
            const { usuarioId } = req.params;
            const { fechaInicio, fechaFin } = req.query;
            if (!fechaInicio || !fechaFin) {
                return res.status(400).json({
                    error: 'Los parámetros fechaInicio y fechaFin son requeridos'
                });
            }
            const inicio = new Date(fechaInicio);
            const fin = new Date(fechaFin);
            fin.setHours(23, 59, 59, 999);
            const accesos = await data_1.prisma.acceso.findMany({
                where: {
                    creadoPor: Number(usuarioId),
                    fechaCreacion: {
                        gte: inicio,
                        lte: fin
                    }
                },
                include: {
                    creador: {
                        select: {
                            nombre: true,
                            apellidos: true,
                            email: true
                        }
                    },
                    turno: {
                        select: {
                            nombreTurno: true
                        }
                    },
                    identificacion: {
                        select: {
                            tipo: true,
                            numero: true
                        }
                    },
                    filtro: {
                        select: {
                            nombre: true,
                            descripcion: true
                        }
                    }
                },
                orderBy: { fechaCreacion: 'desc' }
            });
            const estadisticas = {
                totalAccesos: accesos.length,
                accesosActivos: accesos.filter(a => !a.horaSalida).length,
                conIdentificacion: accesos.filter(a => a.identificacionId).length,
                conAcompanante: accesos.filter(a => a.tieneAcompanante).length,
                accesosConFiltro: accesos.filter(a => a.filtroId).length
            };
            // Agrupar por área y motivo para este usuario
            const agrupaciones = {
                porArea: ReporteController.agruparPorArea(accesos),
                porMotivo: ReporteController.agruparPorMotivo(accesos),
                porFiltro: ReporteController.agruparPorFiltro(accesos)
            };
            res.json({
                success: true,
                datos: { accesos },
                estadisticas,
                agrupaciones,
                metadata: {
                    fechaGeneracion: new Date(),
                    periodo: `${inicio.toLocaleDateString()} - ${fin.toLocaleDateString()}`,
                    totalRegistros: accesos.length
                }
            });
        }
        catch (error) {
            console.error('❌ Error en reporte por usuario:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };
    // Método para obtener estadísticas rápidas (para dashboards)
    static getEstadisticasRapidas = async (req, res) => {
        try {
            const { fechaInicio, fechaFin } = req.query;
            const inicio = fechaInicio ? new Date(fechaInicio) : new Date();
            const fin = fechaFin ? new Date(fechaFin) : new Date();
            if (fechaInicio && fechaFin) {
                fin.setHours(23, 59, 59, 999);
            }
            else {
                // Si no se especifican fechas, usar último mes
                inicio.setDate(inicio.getDate() - 30);
            }
            const [totalAccesos, accesosActivos, totalTurnos, usuariosActivos, totalFiltros] = await Promise.all([
                data_1.prisma.acceso.count({
                    where: {
                        fechaCreacion: {
                            gte: inicio,
                            lte: fin
                        }
                    }
                }),
                data_1.prisma.acceso.count({
                    where: {
                        horaSalida: null,
                        fechaCreacion: {
                            gte: inicio,
                            lte: fin
                        }
                    }
                }),
                data_1.prisma.turno.count({
                    where: { estaActivo: true }
                }),
                data_1.prisma.usuario.count({
                    where: { estaActivo: true }
                }),
                data_1.prisma.filtro.count({
                    where: { estaActivo: true }
                })
            ]);
            const diasPeriodo = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            res.json({
                success: true,
                estadisticas: {
                    totalAccesos,
                    accesosActivos,
                    totalTurnos,
                    usuariosActivos,
                    totalFiltros,
                    promedioDiario: diasPeriodo > 0 ? Math.round(totalAccesos / diasPeriodo) : 0,
                    tasaCompletitud: totalAccesos > 0 ? ((totalAccesos - accesosActivos) / totalAccesos * 100) : 0
                },
                periodo: {
                    inicio: inicio.toISOString(),
                    fin: fin.toISOString(),
                    dias: diasPeriodo
                }
            });
        }
        catch (error) {
            console.error('❌ Error obteniendo estadísticas rápidas:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    };
}
exports.ReporteController = ReporteController;
//# sourceMappingURL=reporte.controller.js.map