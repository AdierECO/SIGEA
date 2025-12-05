"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentificacionController = void 0;
const data_1 = require("../data");
class IdentificacionController {
    static getIdentificaciones = async (req, res) => {
        try {
            const { page = 1, limit = 10, search, tipo, vigente } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            if (search) {
                where.OR = [
                    { numero: { contains: search } }
                ];
            }
            if (tipo) {
                where.tipo = tipo;
            }
            if (vigente !== undefined) {
                where.vigente = vigente === 'true';
            }
            const [identificaciones, total] = await Promise.all([
                data_1.prisma.identificacion.findMany({
                    where,
                    include: {
                        accesos: {
                            select: {
                                id: true,
                                nombre: true,
                                apellidos: true,
                                horaEntrada: true,
                                horaSalida: true
                            },
                            orderBy: { fechaCreacion: 'desc' },
                            take: 5
                        },
                        filtro: {
                            select: {
                                id: true,
                                nombre: true,
                                ubicacion: true
                            }
                        },
                        _count: {
                            select: { accesos: true }
                        }
                    },
                    orderBy: { id: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                data_1.prisma.identificacion.count({ where })
            ]);
            res.json({
                identificaciones,
                total,
                totalPages: Math.ceil(total / Number(limit)),
                currentPage: Number(page)
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    static getIdentificacionById = async (req, res) => {
        try {
            const { id } = req.params;
            const identificacion = await data_1.prisma.identificacion.findUnique({
                where: { id: Number(id) },
                include: {
                    accesos: {
                        include: {
                            creador: {
                                select: { nombre: true, apellidos: true }
                            },
                            turno: {
                                select: { id: true, nombreTurno: true }
                            },
                            filtro: {
                                select: { id: true, nombre: true }
                            }
                        },
                        orderBy: { fechaCreacion: 'desc' }
                    },
                    filtro: {
                        include: {
                            usuarioCreador: {
                                select: { nombre: true, apellidos: true }
                            }
                        }
                    },
                    _count: {
                        select: { accesos: true }
                    }
                }
            });
            if (!identificacion) {
                return res.status(404).json({ error: 'Identificación no encontrada' });
            }
            res.json(identificacion);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    static getIdentificacionByNumero = async (req, res) => {
        try {
            const { numero } = req.params;
            const identificacion = await data_1.prisma.identificacion.findUnique({
                where: { numero },
                include: {
                    accesos: {
                        include: {
                            creador: {
                                select: { nombre: true, apellidos: true }
                            },
                            turno: {
                                select: { id: true, nombreTurno: true }
                            },
                            filtro: {
                                select: { id: true, nombre: true }
                            }
                        },
                        orderBy: { fechaCreacion: 'desc' },
                        take: 10
                    },
                    filtro: {
                        select: {
                            id: true,
                            nombre: true,
                            ubicacion: true
                        }
                    },
                    _count: {
                        select: { accesos: true }
                    }
                }
            });
            if (!identificacion) {
                return res.status(404).json({ error: 'Identificación no encontrada' });
            }
            res.json(identificacion);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    static createIdentificacion = async (req, res) => {
        try {
            const { tipo, numero, vigente = true, filtroId } = req.body;
            const usuario = req.user;
            if (numero && numero.trim()) {
                const identificacionExistente = await data_1.prisma.identificacion.findUnique({
                    where: { numero }
                });
                if (identificacionExistente) {
                    return res.status(400).json({ error: 'Ya existe una identificación con este número' });
                }
            }
            // Si no se proporciona filtroId, usar el del usuario si tiene
            let filtroIdFinal = filtroId;
            if (!filtroIdFinal) {
                const usuarioConFiltro = await data_1.prisma.usuario.findUnique({
                    where: { id: usuario.id },
                    select: { filtroAsignadoId: true }
                });
                filtroIdFinal = usuarioConFiltro?.filtroAsignadoId || null;
            }
            if (filtroIdFinal) {
                const filtroExistente = await data_1.prisma.filtro.findUnique({
                    where: { id: filtroIdFinal }
                });
                if (!filtroExistente) {
                    return res.status(400).json({ error: 'El filtro especificado no existe' });
                }
            }
            const identificacionData = {
                tipo,
                vigente
            };
            if (numero && numero.trim()) {
                identificacionData.numero = numero;
            }
            else {
                identificacionData.numero = null;
            }
            // Siempre asignar filtroId (puede ser null)
            identificacionData.filtroId = filtroIdFinal;
            const identificacion = await data_1.prisma.identificacion.create({
                data: identificacionData,
                include: {
                    filtro: {
                        select: {
                            id: true,
                            nombre: true,
                            ubicacion: true
                        }
                    },
                    _count: {
                        select: { accesos: true }
                    }
                }
            });
            // Incluir filtroId en el registro de auditoría
            await data_1.prisma.auditoria.create({
                data: {
                    tipo: 'IDENTIFICACION',
                    accion: 'CREACION_IDENTIFICACION',
                    descripcion: `Nueva identificación creada: ${tipo} ${numero || 'sin número'}`,
                    usuarioId: usuario.id,
                    identificacionId: identificacion.id,
                    filtroId: identificacion.filtroId // INCLUIR EL FILTRO EN AUDITORÍA
                }
            });
            res.status(201).json(identificacion);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    static updateIdentificacion = async (req, res) => {
        try {
            const { id } = req.params;
            const { tipo, numero, vigente, filtroId } = req.body;
            const usuario = req.user;
            const identificacionExistente = await data_1.prisma.identificacion.findUnique({
                where: { id: Number(id) },
                include: {
                    filtro: {
                        select: { id: true, nombre: true }
                    }
                }
            });
            if (!identificacionExistente) {
                return res.status(404).json({ error: 'Identificación no encontrada' });
            }
            // VALIDACIÓN MEJORADA: Solo validar duplicados si se cambia el número y no es null
            if (numero && numero !== identificacionExistente.numero && numero.trim()) {
                const numeroExistente = await data_1.prisma.identificacion.findUnique({
                    where: { numero }
                });
                if (numeroExistente) {
                    return res.status(400).json({ error: 'Ya existe otra identificación con este número' });
                }
            }
            // VALIDAR FILTRO SI SE PROPORCIONA
            if (filtroId) {
                const filtroExistente = await data_1.prisma.filtro.findUnique({
                    where: { id: filtroId }
                });
                if (!filtroExistente) {
                    return res.status(400).json({ error: 'El filtro especificado no existe' });
                }
            }
            // DATOS MEJORADOS: Manejar número como null si está vacío
            const updateData = {};
            if (tipo !== undefined)
                updateData.tipo = tipo;
            if (vigente !== undefined)
                updateData.vigente = vigente;
            if (numero !== undefined) {
                updateData.numero = numero && numero.trim() ? numero : null;
            }
            if (filtroId !== undefined) {
                updateData.filtroId = filtroId || null;
            }
            const identificacion = await data_1.prisma.identificacion.update({
                where: { id: Number(id) },
                data: updateData,
                include: {
                    filtro: {
                        select: {
                            id: true,
                            nombre: true,
                            ubicacion: true
                        }
                    },
                    _count: {
                        select: { accesos: true }
                    }
                }
            });
            // Incluir filtroId en el registro de auditoría
            await data_1.prisma.auditoria.create({
                data: {
                    tipo: 'IDENTIFICACION',
                    accion: 'IDENTIFICACIÓN_ACTUALIZADA',
                    descripcion: `Identificación ${id} actualizada`,
                    usuarioId: usuario.id,
                    identificacionId: Number(id),
                    filtroId: identificacion.filtroId // INCLUIR EL FILTRO EN AUDITORÍA
                }
            });
            res.json(identificacion);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    static toggleVigenciaIdentificacion = async (req, res) => {
        try {
            const { id } = req.params;
            const usuario = req.user;
            const identificacionExistente = await data_1.prisma.identificacion.findUnique({
                where: { id: Number(id) },
                include: {
                    filtro: {
                        select: { id: true, nombre: true }
                    }
                }
            });
            if (!identificacionExistente) {
                return res.status(404).json({ error: 'Identificación no encontrada' });
            }
            const identificacion = await data_1.prisma.identificacion.update({
                where: { id: Number(id) },
                data: {
                    vigente: !identificacionExistente.vigente
                },
                include: {
                    filtro: {
                        select: {
                            id: true,
                            nombre: true
                        }
                    },
                    _count: {
                        select: { accesos: true }
                    }
                }
            });
            // Incluir filtroId en el registro de auditoría
            await data_1.prisma.auditoria.create({
                data: {
                    tipo: 'IDENTIFICACION',
                    accion: 'CAMBIO_VIGENCIA',
                    descripcion: `Identificación ${id} ${identificacion.vigente ? 'activada' : 'desactivada'}`,
                    usuarioId: usuario.id,
                    identificacionId: Number(id),
                    filtroId: identificacion.filtroId // INCLUIR EL FILTRO EN AUDITORÍA
                }
            });
            res.json({
                message: `Identificación ${identificacion.vigente ? 'activada' : 'desactivada'} exitosamente`,
                identificacion
            });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    static getIdentificacionesVigentes = async (req, res) => {
        try {
            const identificaciones = await data_1.prisma.identificacion.findMany({
                where: {
                    vigente: true,
                    numero: { not: null } // Solo incluir identificaciones con número
                },
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
                },
                orderBy: { numero: 'asc' }
            });
            res.json(identificaciones);
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
}
exports.IdentificacionController = IdentificacionController;
//# sourceMappingURL=identificaciones.controller.js.map