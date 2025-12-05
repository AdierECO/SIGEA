"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditoriaController = void 0;
const data_1 = require("../data");
class AuditoriaController {
    static getLogsFiltro = async (req, res) => {
        try {
            const { page = 1, limit = 50, tipo, fechaInicio, fechaFin, usuario, filtroId } = req.query;
            const usuarioActual = req.user;
            const skip = (Number(page) - 1) * Number(limit);
            // Buscar por IDs específicos
            let filtroIdBusqueda = null;
            if (filtroId && filtroId !== 'todos') {
                filtroIdBusqueda = Number(filtroId);
            }
            else {
                const filtroUsuario = await data_1.prisma.usuario.findUnique({
                    where: { id: usuarioActual.id },
                    select: { filtroAsignadoId: true }
                });
                filtroIdBusqueda = filtroUsuario?.filtroAsignadoId || null;
            }
            // Buscar auditorías relacionadas con el filtro
            const where = {};
            if (filtroIdBusqueda) {
                // Buscar auditorías que tengan relación directa o indirecta con el filtro
                where.OR = [
                    // Actividades directas del filtro
                    { filtroId: filtroIdBusqueda },
                    // Accesos que pertenecen al filtro
                    { acceso: { filtroId: filtroIdBusqueda } },
                    // Identificaciones que están en el filtro
                    { identificacion: { filtroId: filtroIdBusqueda } },
                    // TIAS que están en el filtro
                    { tias: { filtroId: filtroIdBusqueda } }
                ];
            }
            // Filtros adicionales
            if (tipo && tipo !== 'todos') {
                where.tipo = tipo;
            }
            if (fechaInicio || fechaFin) {
                where.fechaCreacion = {};
                if (fechaInicio)
                    where.fechaCreacion.gte = new Date(fechaInicio);
                if (fechaFin) {
                    const fin = new Date(fechaFin);
                    fin.setHours(23, 59, 59, 999);
                    where.fechaCreacion.lte = fin;
                }
            }
            if (usuario) {
                where.usuario = {
                    email: { contains: usuario, mode: 'insensitive' }
                };
            }
            console.log('🔍 Where clause:', JSON.stringify(where, null, 2));
            const [logs, total] = await Promise.all([
                data_1.prisma.auditoria.findMany({
                    where,
                    include: {
                        usuario: {
                            select: {
                                id: true,
                                email: true,
                                nombre: true,
                                apellidos: true
                            }
                        },
                        acceso: {
                            select: {
                                id: true,
                                nombre: true,
                                apellidos: true,
                                area: true,
                                identificacion: {
                                    select: {
                                        tipo: true,
                                        numero: true
                                    }
                                },
                                tias: {
                                    select: {
                                        id: true,
                                        tipo: true
                                    }
                                },
                                filtro: {
                                    select: {
                                        id: true,
                                        nombre: true
                                    }
                                }
                            }
                        },
                        turno: {
                            select: {
                                id: true,
                                nombreTurno: true
                            }
                        },
                        identificacion: {
                            select: {
                                id: true,
                                tipo: true,
                                numero: true,
                                filtro: {
                                    select: {
                                        id: true,
                                        nombre: true
                                    }
                                }
                            }
                        },
                        tias: {
                            select: {
                                id: true,
                                tipo: true,
                                filtro: {
                                    select: {
                                        id: true,
                                        nombre: true
                                    }
                                }
                            }
                        },
                        filtro: {
                            select: {
                                id: true,
                                nombre: true
                            }
                        }
                    },
                    orderBy: { fechaCreacion: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                data_1.prisma.auditoria.count({ where })
            ]);
            console.log(`📊 Encontrados ${logs.length} logs de ${total} total`);
            // Formatear respuesta
            const logsFormateados = logs.map(log => {
                // Determinar tipo real
                let tipoReal = log.tipo;
                if (log.acceso)
                    tipoReal = 'ACCESO';
                else if (log.turno)
                    tipoReal = 'TURNO';
                else if (log.identificacion)
                    tipoReal = 'IDENTIFICACION';
                else if (log.tias)
                    tipoReal = 'TIAS';
                else if (log.filtro && log.tipo !== 'REPORTE')
                    tipoReal = 'FILTRO';
                // Determinar filtro
                let filtroNombre = log.filtro?.nombre;
                let filtroIdReal = log.filtro?.id;
                if (!filtroNombre && log.acceso?.filtro) {
                    filtroNombre = log.acceso.filtro.nombre;
                    filtroIdReal = log.acceso.filtro.id;
                }
                else if (!filtroNombre && log.identificacion?.filtro) {
                    filtroNombre = log.identificacion.filtro.nombre;
                    filtroIdReal = log.identificacion.filtro.id;
                }
                else if (!filtroNombre && log.tias?.filtro) {
                    filtroNombre = log.tias.filtro.nombre;
                    filtroIdReal = log.tias.filtro.id;
                }
                return {
                    id: log.id,
                    fecha: new Date(log.fechaCreacion).toLocaleString('es-MX', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }),
                    usuario: log.usuario?.email || 'Usuario no disponible',
                    accion: log.accion,
                    tipo: tipoReal,
                    descripcion: log.descripcion,
                    detalles: {
                        persona: log.acceso ? `${log.acceso.nombre} ${log.acceso.apellidos}` : null,
                        identificacion: log.acceso?.identificacion?.numero || log.identificacion?.numero,
                        tias: log.acceso?.tias?.id || log.tias?.id,
                        tipoTIAS: log.acceso?.tias?.tipo || log.tias?.tipo,
                        turno: log.turno?.nombreTurno,
                        area: log.acceso?.area,
                        filtro: filtroNombre,
                        filtroId: filtroIdReal
                    }
                };
            });
            res.json({
                logs: logsFormateados,
                total,
                totalPages: Math.ceil(total / Number(limit)),
                currentPage: Number(page)
            });
        }
        catch (error) {
            console.error('❌ Error obteniendo logs:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    static getDetalleAuditoria = async (req, res) => {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({ error: 'ID de auditoría no proporcionado' });
            }
            const auditoria = await data_1.prisma.auditoria.findUnique({
                where: { id: Number(id) },
                include: {
                    usuario: {
                        select: {
                            id: true,
                            email: true,
                            nombre: true,
                            apellidos: true,
                            rol: true
                        }
                    },
                    acceso: {
                        include: {
                            identificacion: {
                                select: {
                                    id: true,
                                    tipo: true,
                                    numero: true,
                                    vigente: true
                                }
                            },
                            tias: {
                                select: {
                                    id: true,
                                    tipo: true,
                                    filtro: {
                                        select: {
                                            id: true,
                                            nombre: true,
                                            ubicacion: true
                                        }
                                    }
                                }
                            },
                            filtro: {
                                select: {
                                    id: true,
                                    nombre: true,
                                    ubicacion: true
                                }
                            },
                            creador: {
                                select: {
                                    id: true,
                                    email: true,
                                    nombre: true,
                                    apellidos: true
                                }
                            }
                        }
                    },
                    turno: {
                        include: {
                            creador: {
                                select: {
                                    id: true,
                                    email: true,
                                    nombre: true,
                                    apellidos: true
                                }
                            },
                            usuarios: {
                                include: {
                                    usuario: {
                                        select: {
                                            id: true,
                                            email: true,
                                            nombre: true,
                                            apellidos: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    identificacion: {
                        include: {
                            filtro: {
                                select: {
                                    id: true,
                                    nombre: true,
                                    ubicacion: true
                                }
                            },
                            accesos: {
                                select: {
                                    id: true,
                                    nombre: true,
                                    apellidos: true,
                                    horaEntrada: true,
                                    horaSalida: true
                                }
                            }
                        }
                    },
                    tias: {
                        include: {
                            filtro: {
                                select: {
                                    id: true,
                                    nombre: true,
                                    ubicacion: true
                                }
                            },
                            accesos: {
                                select: {
                                    id: true,
                                    nombre: true,
                                    apellidos: true,
                                    horaEntrada: true,
                                    horaSalida: true
                                }
                            }
                        }
                    },
                    filtro: {
                        include: {
                            usuarioCreador: {
                                select: {
                                    id: true,
                                    email: true,
                                    nombre: true,
                                    apellidos: true
                                }
                            },
                            usuariosAsignados: {
                                select: {
                                    id: true,
                                    email: true,
                                    nombre: true,
                                    apellidos: true
                                }
                            }
                        }
                    }
                }
            });
            if (!auditoria) {
                return res.status(404).json({ error: 'Registro de auditoría no encontrado' });
            }
            // Formatear la respuesta según el tipo de auditoría
            let detallesCompletos = {
                id: auditoria.id,
                fecha: new Date(auditoria.fechaCreacion).toLocaleString('es-MX', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }),
                usuario: auditoria.usuario?.email || 'Sistema',
                accion: auditoria.accion,
                tipo: auditoria.tipo,
                descripcion: auditoria.descripcion,
                recurso: `/api/${auditoria.tipo.toLowerCase()}`,
                duracion: 150,
                parametros: {},
                respuesta: {
                    codigo: 200,
                    mensaje: 'Operación completada exitosamente',
                    datos: {}
                },
                detallesAdicionales: {
                    sistema: 'AIFA v1.0',
                    version: '1.2.3',
                    fechaConsulta: new Date().toLocaleString('es-MX', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }),
                }
            };
            // Enriquecer detalles según el tipo de auditoría
            switch (auditoria.tipo) {
                case 'ACCESO':
                    if (auditoria.acceso) {
                        detallesCompletos.detalles = {
                            persona: `${auditoria.acceso.nombre} ${auditoria.acceso.apellidos}`,
                            identificacion: auditoria.acceso.identificacion?.numero,
                            tipoIdentificacion: auditoria.acceso.identificacion?.tipo,
                            tias: auditoria.acceso.tias?.id,
                            tipoTIAS: auditoria.acceso.tias?.tipo,
                            area: auditoria.acceso.area,
                            telefono: auditoria.acceso.telefono,
                            empresa: auditoria.acceso.empresa,
                            motivo: auditoria.acceso.motivo,
                            tieneAcompanante: auditoria.acceso.tieneAcompanante,
                            nombreAcompanante: auditoria.acceso.nombreAcompanante,
                            conGrupo: auditoria.acceso.conGrupo,
                            cantidadGrupo: auditoria.acceso.cantidadGrupo,
                            horaEntrada: auditoria.acceso.horaEntrada,
                            horaSalida: auditoria.acceso.horaSalida,
                            filtro: auditoria.acceso.filtro?.nombre,
                            filtroId: auditoria.acceso.filtro?.id,
                            creadoPor: auditoria.acceso.creador?.email
                        };
                        detallesCompletos.parametros = {
                            nombre: auditoria.acceso.nombre,
                            apellidos: auditoria.acceso.apellidos,
                            identificacion: auditoria.acceso.identificacion?.numero,
                            tias: auditoria.acceso.tias?.id,
                            area: auditoria.acceso.area,
                            motivo: auditoria.acceso.motivo
                        };
                        detallesCompletos.respuesta.datos = {
                            idAcceso: auditoria.acceso.id,
                            horaRegistro: new Date(auditoria.fechaCreacion).toLocaleString('es-MX', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                            }),
                        };
                        detallesCompletos.detallesAdicionales.ubicacion = auditoria.acceso.filtro?.ubicacion;
                        detallesCompletos.detallesAdicionales.identificacionVigente = auditoria.acceso.identificacion?.vigente;
                    }
                    break;
                case 'TURNO':
                    if (auditoria.turno) {
                        detallesCompletos.detalles = {
                            nombreTurno: auditoria.turno.nombreTurno,
                            horaInicio: auditoria.turno.horaInicio,
                            horaFin: auditoria.turno.horaFin,
                            estaActivo: auditoria.turno.estaActivo,
                            creadoPor: auditoria.turno.creador?.email,
                            usuariosAsignados: auditoria.turno.usuarios.map(tu => tu.usuario.email)
                        };
                        detallesCompletos.parametros = {
                            nombreTurno: auditoria.turno.nombreTurno,
                            horaInicio: auditoria.turno.horaInicio,
                            horaFin: auditoria.turno.horaFin
                        };
                        detallesCompletos.respuesta.datos = {
                            idTurno: auditoria.turno.id,
                            usuariosAsignados: auditoria.turno.usuarios.length
                        };
                    }
                    break;
                case 'IDENTIFICACION':
                    if (auditoria.identificacion) {
                        detallesCompletos.detalles = {
                            tipo: auditoria.identificacion.tipo,
                            numero: auditoria.identificacion.numero,
                            vigente: auditoria.identificacion.vigente,
                            filtro: auditoria.identificacion.filtro?.nombre,
                            filtroId: auditoria.identificacion.filtro?.id,
                            accesosRelacionados: auditoria.identificacion.accesos.length
                        };
                        detallesCompletos.parametros = {
                            tipo: auditoria.identificacion.tipo,
                            numero: auditoria.identificacion.numero,
                            vigente: auditoria.identificacion.vigente
                        };
                        detallesCompletos.respuesta.datos = {
                            idIdentificacion: auditoria.identificacion.id,
                            accesosAsociados: auditoria.identificacion.accesos.length
                        };
                        detallesCompletos.detallesAdicionales.ubicacion = auditoria.identificacion.filtro?.ubicacion;
                    }
                    break;
                case 'TIAS':
                    if (auditoria.tias) {
                        detallesCompletos.detalles = {
                            id: auditoria.tias.id,
                            tipo: auditoria.tias.tipo,
                            filtro: auditoria.tias.filtro?.nombre,
                            filtroId: auditoria.tias.filtro?.id,
                            accesosRelacionados: auditoria.tias.accesos.length,
                            fechaCreacion: auditoria.tias.fechaCreacion
                        };
                        detallesCompletos.parametros = {
                            id: auditoria.tias.id,
                            tipo: auditoria.tias.tipo
                        };
                        detallesCompletos.respuesta.datos = {
                            idTIAS: auditoria.tias.id,
                            accesosAsociados: auditoria.tias.accesos.length
                        };
                        detallesCompletos.detallesAdicionales.ubicacion = auditoria.tias.filtro?.ubicacion;
                    }
                    break;
                case 'FILTRO':
                    if (auditoria.filtro) {
                        detallesCompletos.detalles = {
                            nombre: auditoria.filtro.nombre,
                            descripcion: auditoria.filtro.descripcion,
                            ubicacion: auditoria.filtro.ubicacion,
                            cantidad: auditoria.filtro.cantidad,
                            estaActivo: auditoria.filtro.estaActivo,
                            usuarioCreador: auditoria.filtro.usuarioCreador?.email,
                            usuariosAsignados: auditoria.filtro.usuariosAsignados.map(u => u.email)
                        };
                        detallesCompletos.parametros = {
                            nombre: auditoria.filtro.nombre,
                            descripcion: auditoria.filtro.descripcion,
                            ubicacion: auditoria.filtro.ubicacion,
                            cantidad: auditoria.filtro.cantidad
                        };
                        detallesCompletos.respuesta.datos = {
                            idFiltro: auditoria.filtro.id,
                            totalUsuariosAsignados: auditoria.filtro.usuariosAsignados.length
                        };
                    }
                    break;
                case 'REPORTE':
                    detallesCompletos.detalles = {
                        tipoReporte: auditoria.descripcion?.includes('exportación') ? 'EXPORTACION' : 'GENERAL',
                        accion: auditoria.accion
                    };
                    detallesCompletos.parametros = {
                        tipo: 'REPORTE',
                        accion: auditoria.accion
                    };
                    detallesCompletos.respuesta.datos = {
                        reporteGenerado: true,
                        fechaGeneracion: new Date(auditoria.fechaCreacion).toLocaleString('es-MX', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        }),
                    };
                    break;
                default:
                    detallesCompletos.detalles = {
                        accion: auditoria.accion,
                        descripcion: auditoria.descripcion
                    };
                    break;
            }
            // Agregar información del usuario que realizó la acción
            if (auditoria.usuario) {
                detallesCompletos.detallesAdicionales.usuarioAccion = `${auditoria.usuario.nombre} ${auditoria.usuario.apellidos}`;
                detallesCompletos.detallesAdicionales.rolUsuario = auditoria.usuario.rol;
            }
            console.log(`📋 Detalle de auditoría ${id} cargado exitosamente`);
            res.json(detallesCompletos);
        }
        catch (error) {
            console.error('❌ Error obteniendo detalle de auditoría:', error);
            res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    static getEstadisticasFiltro = async (req, res) => {
        try {
            const { filtroId } = req.query;
            const usuarioActual = req.user;
            const where = {};
            if (filtroId && filtroId !== 'todos') {
                const filtroIdNum = Number(filtroId);
                where.OR = [
                    { filtroId: filtroIdNum },
                    { acceso: { filtroId: filtroIdNum } },
                    { identificacion: { filtroId: filtroIdNum } },
                    { tias: { filtroId: filtroIdNum } }
                ];
            }
            else {
                const usuario = await data_1.prisma.usuario.findUnique({
                    where: { id: usuarioActual.id },
                    select: { filtroAsignadoId: true }
                });
                if (usuario?.filtroAsignadoId) {
                    where.OR = [
                        { filtroId: usuario.filtroAsignadoId },
                        { acceso: { filtroId: usuario.filtroAsignadoId } },
                        { identificacion: { filtroId: usuario.filtroAsignadoId } },
                        { tias: { filtroId: usuario.filtroAsignadoId } }
                    ];
                }
                else {
                    return res.json({
                        total: 0,
                        accesos: 0,
                        turnos: 0,
                        identificaciones: 0,
                        tias: 0,
                        reportes: 0,
                        actividadesHoy: 0,
                        usuariosActivos: 0,
                        filtrosActivos: 0
                    });
                }
            }
            // Contar usando la misma lógica de filtrado
            const [total, actividadesHoy, usuariosUnicos, filtrosActivosCount] = await Promise.all([
                data_1.prisma.auditoria.count({ where }),
                // Actividades de hoy
                data_1.prisma.auditoria.count({
                    where: {
                        ...where,
                        fechaCreacion: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0))
                        }
                    }
                }),
                // Usuarios únicos en el filtro
                data_1.prisma.auditoria.groupBy({
                    by: ['usuarioId'],
                    where,
                    _count: { usuarioId: true }
                }),
                // Contar filtros activos en el sistema
                data_1.prisma.filtro.count({
                    where: { estaActivo: true }
                })
            ]);
            // Contar por tipos usando la misma lógica de filtrado
            const [accesos, turnos, identificaciones, tias, reportes, gestionFiltros] = await Promise.all([
                data_1.prisma.auditoria.count({
                    where: {
                        ...where,
                        OR: [
                            { tipo: 'ACCESO' },
                            { acceso: { id: { not: null } } }
                        ]
                    }
                }),
                data_1.prisma.auditoria.count({
                    where: {
                        ...where,
                        OR: [
                            { tipo: 'TURNO' },
                            { turno: { id: { not: null } } }
                        ]
                    }
                }),
                data_1.prisma.auditoria.count({
                    where: {
                        ...where,
                        OR: [
                            { tipo: 'IDENTIFICACION' },
                            { identificacion: { id: { not: null } } }
                        ]
                    }
                }),
                data_1.prisma.auditoria.count({
                    where: {
                        ...where,
                        OR: [
                            { tipo: 'TIAS' },
                            { tias: { id: { not: null } } }
                        ]
                    }
                }),
                data_1.prisma.auditoria.count({
                    where: {
                        ...where,
                        tipo: 'REPORTE'
                    }
                }),
                data_1.prisma.auditoria.count({
                    where: {
                        ...where,
                        tipo: 'FILTRO'
                    }
                })
            ]);
            res.json({
                total,
                accesos,
                turnos,
                identificaciones,
                tias,
                reportes,
                actividadesHoy,
                usuariosActivos: usuariosUnicos.length,
                filtrosActivos: filtrosActivosCount
            });
        }
        catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
}
exports.AuditoriaController = AuditoriaController;
//# sourceMappingURL=auditoria.controller.js.map