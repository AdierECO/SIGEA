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
                                registradoPor: true, // ← Para ACCESOS
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
                                },
                                // Incluir accesos relacionados para obtener registradoPor
                                accesos: {
                                    select: {
                                        id: true,
                                        registradoPor: true
                                    },
                                    take: 1 // Solo el primer acceso
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
            // **Recopilar todos los emails de usuarios necesarios**
            const userEmails = new Set();
            logs.forEach(log => {
                // Email del usuario que realizó la auditoría
                if (log.usuario?.email)
                    userEmails.add(log.usuario.email);
                // Email de registradoPor si es un ACCESO
                if (log.tipo === 'ACCESO' && log.acceso?.registradoPor) {
                    userEmails.add(log.acceso.registradoPor);
                }
                // **Email de registradoPor si es una IDENTIFICACION (de sus accesos)**
                if (log.tipo === 'IDENTIFICACION' && log.identificacion && log.identificacion?.accesos?.length > 0) {
                    const primerAcceso = log.identificacion.accesos[0];
                    if (primerAcceso.registradoPor) {
                        userEmails.add(primerAcceso.registradoPor);
                    }
                }
            });
            // **Buscar usuarios por email**
            const usuariosPorEmail = new Map();
            if (userEmails.size > 0) {
                const usuarios = await data_1.prisma.usuario.findMany({
                    where: {
                        email: { in: Array.from(userEmails) }
                    },
                    select: {
                        id: true,
                        email: true,
                        nombre: true,
                        apellidos: true
                    }
                });
                usuarios.forEach(u => usuariosPorEmail.set(u.email, u));
            }
            // Formatear respuesta
            const logsFormateados = logs.map(log => {
                // Mantener el tipo original
                const tipoReal = log.tipo;
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
                // **Determinar qué información mostrar**
                let nombreMostrar = null;
                let emailMostrar = null;
                let usuarioMostrar = 'Usuario no disponible';
                // **1. PARA ACCESOS: Mostrar el registradoPor**
                if (log.tipo === 'ACCESO' && log.acceso?.registradoPor) {
                    const emailRegistrador = log.acceso.registradoPor;
                    const usuarioRegistrador = usuariosPorEmail.get(emailRegistrador);
                    if (usuarioRegistrador) {
                        nombreMostrar = usuarioRegistrador.nombre
                            ? `${usuarioRegistrador.nombre} ${usuarioRegistrador.apellidos || ''}`.trim()
                            : null;
                        emailMostrar = usuarioRegistrador.email || null;
                        usuarioMostrar = nombreMostrar && emailMostrar
                            ? `${nombreMostrar} (${emailMostrar})`
                            : (nombreMostrar || emailMostrar || 'Operativo');
                    }
                    else {
                        nombreMostrar = null;
                        emailMostrar = emailRegistrador;
                        usuarioMostrar = emailRegistrador || 'Operativo';
                    }
                }
                // **2. PARA IDENTIFICACIONES: Mostrar registradoPor del primer acceso**
                else if (log.tipo === 'IDENTIFICACION' && log.identificacion && log.identificacion?.accesos?.length > 0) {
                    const primerAcceso = log.identificacion.accesos[0];
                    if (primerAcceso.registradoPor) {
                        const emailRegistrador = primerAcceso.registradoPor;
                        const usuarioRegistrador = usuariosPorEmail.get(emailRegistrador);
                        if (usuarioRegistrador) {
                            nombreMostrar = usuarioRegistrador.nombre
                                ? `${usuarioRegistrador.nombre} ${usuarioRegistrador.apellidos || ''}`.trim()
                                : null;
                            emailMostrar = usuarioRegistrador.email || null;
                            usuarioMostrar = nombreMostrar && emailMostrar
                                ? `${nombreMostrar} (${emailMostrar})`
                                : (nombreMostrar || emailMostrar || 'Operativo');
                        }
                        else {
                            nombreMostrar = null;
                            emailMostrar = emailRegistrador;
                            usuarioMostrar = emailRegistrador || 'Operativo';
                        }
                    }
                    else if (log.usuario) {
                        // Fallback: usar el usuario normal
                        nombreMostrar = log.usuario.nombre
                            ? `${log.usuario.nombre} ${log.usuario.apellidos || ''}`.trim()
                            : null;
                        emailMostrar = log.usuario.email || null;
                        usuarioMostrar = nombreMostrar && emailMostrar
                            ? `${nombreMostrar} (${emailMostrar})`
                            : (nombreMostrar || emailMostrar || 'Usuario no disponible');
                    }
                }
                // **3. PARA OTROS TIPOS: Mostrar el usuario normal**
                else if (log.usuario) {
                    nombreMostrar = log.usuario.nombre
                        ? `${log.usuario.nombre} ${log.usuario.apellidos || ''}`.trim()
                        : null;
                    emailMostrar = log.usuario.email || null;
                    usuarioMostrar = nombreMostrar && emailMostrar
                        ? `${nombreMostrar} (${emailMostrar})`
                        : (nombreMostrar || emailMostrar || 'Usuario no disponible');
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
                    nombre: nombreMostrar,
                    email: emailMostrar,
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
                        filtroId: filtroIdReal,
                        // Nueva información para el frontend
                        registradoPorEmail: log.tipo === 'ACCESO' ? log.acceso?.registradoPor || null :
                            log.tipo === 'IDENTIFICACION' && log.identificacion && log.identificacion?.accesos?.length > 0
                                ? log.identificacion.accesos[0]?.registradoPor || null
                                : null,
                        esOperativo: log.tipo === 'ACCESO' || log.tipo === 'IDENTIFICACION'
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
                                    horaSalida: true,
                                    registradoPor: true,
                                    creador: {
                                        select: {
                                            id: true,
                                            email: true,
                                            nombre: true,
                                            apellidos: true
                                        }
                                    }
                                },
                                take: 1
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
            // **Función para buscar información del registradoPor por email**
            const buscarRegistradoPor = async (email) => {
                if (!email)
                    return null;
                const usuario = await data_1.prisma.usuario.findUnique({
                    where: {
                        email: email
                    },
                    select: {
                        id: true,
                        email: true,
                        nombre: true,
                        apellidos: true,
                        rol: true
                    }
                });
                return usuario;
            };
            // **Determinar email del registradoPor según el tipo**
            let emailRegistradoPor = null;
            let usuarioRegistrador = null;
            if (auditoria.tipo === 'ACCESO' && auditoria.acceso?.registradoPor) {
                emailRegistradoPor = auditoria.acceso.registradoPor;
            }
            else if (auditoria.tipo === 'IDENTIFICACION' && auditoria.identificacion && auditoria.identificacion?.accesos.length > 0) {
                const primerAcceso = auditoria.identificacion.accesos[0];
                emailRegistradoPor = primerAcceso?.registradoPor || primerAcceso?.creador?.email || null;
            }
            // **Buscar información del registradoPor si existe**
            if (emailRegistradoPor) {
                usuarioRegistrador = await buscarRegistradoPor(emailRegistradoPor);
            }
            // **Determinar qué información mostrar**
            let nombreMostrar = null;
            let emailMostrar = null;
            if ((auditoria.tipo === 'ACCESO' || auditoria.tipo === 'IDENTIFICACION') && usuarioRegistrador) {
                // Para accesos e identificaciones, mostrar el registradoPor
                nombreMostrar = usuarioRegistrador.nombre
                    ? `${usuarioRegistrador.nombre} ${usuarioRegistrador.apellidos || ''}`.trim()
                    : null;
                emailMostrar = usuarioRegistrador.email || null;
            }
            else if ((auditoria.tipo === 'ACCESO' || auditoria.tipo === 'IDENTIFICACION') && emailRegistradoPor) {
                // Si no encontramos al usuario, al menos mostrar el email
                nombreMostrar = null;
                emailMostrar = emailRegistradoPor;
            }
            else if (auditoria.usuario) {
                // Para otros tipos o fallback, usar el usuario normal
                nombreMostrar = auditoria.usuario.nombre
                    ? `${auditoria.usuario.nombre} ${auditoria.usuario.apellidos || ''}`.trim()
                    : null;
                emailMostrar = auditoria.usuario.email || null;
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
                nombre: nombreMostrar,
                email: emailMostrar,
                accion: auditoria.accion,
                tipo: auditoria.tipo,
                recurso: `/api/${auditoria.tipo.toLowerCase()}`,
                duracion: 150,
                parametros: {},
                respuesta: {
                    codigo: 200,
                    mensaje: 'Operación completada exitosamente',
                    datos: {}
                },
                detallesAdicionales: {
                    fechaCreacion: new Date(auditoria.fechaCreacion).toLocaleString('es-MX', {
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
                            creadoPor: auditoria.acceso.creador?.email,
                            // Información específica para accesos
                            registradoPor: usuarioRegistrador?.nombre || auditoria.acceso.registradoPor || 'No disponible',
                            registradoPorEmail: usuarioRegistrador?.email || auditoria.acceso.registradoPor || null,
                            registradoPorRol: usuarioRegistrador?.rol || 'Operativo'
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
                    }
                    break;
                case 'IDENTIFICACION':
                    if (auditoria.identificacion) {
                        const primerAcceso = auditoria.identificacion.accesos[0];
                        detallesCompletos.detalles = {
                            tipo: auditoria.identificacion.tipo,
                            numero: auditoria.identificacion.numero,
                            vigente: auditoria.identificacion.vigente,
                            filtro: auditoria.identificacion.filtro?.nombre,
                            filtroId: auditoria.identificacion.filtro?.id,
                            accesosRelacionados: auditoria.identificacion.accesos.length,
                            // Información para identificaciones
                            primerAccesoId: primerAcceso?.id || null,
                            personaPrimerAcceso: primerAcceso ? `${primerAcceso.nombre} ${primerAcceso.apellidos}` : null,
                            registradoPor: usuarioRegistrador?.nombre || (primerAcceso?.registradoPor || primerAcceso?.creador?.nombre) || 'No disponible',
                            registradoPorEmail: usuarioRegistrador?.email || (primerAcceso?.registradoPor || primerAcceso?.creador?.email) || null,
                            registradoPorRol: usuarioRegistrador?.rol || 'Operativo'
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
                        detallesCompletos.detallesAdicionales.esOperativo = true;
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
                case 'SISTEMA':
                    detallesCompletos.detalles = {
                        accion: auditoria.accion,
                        descripcion: auditoria.descripcion,
                        tipoSistema: auditoria.accion.includes('SESION') ? 'AUTENTICACION' : 'SISTEMA'
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