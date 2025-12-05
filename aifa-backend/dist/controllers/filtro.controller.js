"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiltroController = void 0;
const data_1 = require("../data");
class FiltroController {
    // Obtener todos los filtros con relaciones
    static getFiltros = async (req, res) => {
        try {
            const { page = 1, limit = 10, search, activo } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = {};
            if (search) {
                where.OR = [
                    { nombre: { contains: search, mode: 'insensitive' } },
                    { descripcion: { contains: search, mode: 'insensitive' } },
                    { ubicacion: { contains: search, mode: 'insensitive' } }
                ];
            }
            if (activo !== undefined) {
                where.estaActivo = activo === 'true';
            }
            const [filtros, total] = await Promise.all([
                data_1.prisma.filtro.findMany({
                    where,
                    include: {
                        usuarioCreador: {
                            select: {
                                id: true,
                                nombre: true,
                                apellidos: true,
                                email: true
                            }
                        },
                        usuariosAsignados: {
                            select: {
                                id: true,
                                nombre: true,
                                apellidos: true,
                                email: true,
                                rol: true
                            }
                        },
                        tias: {
                            select: {
                                id: true,
                                tipo: true,
                                fechaCreacion: true
                            }
                        },
                        _count: {
                            select: {
                                usuariosAsignados: true,
                                accesos: true,
                                identificaciones: true,
                                tias: true
                            }
                        }
                    },
                    orderBy: { nombre: 'asc' },
                    skip,
                    take: Number(limit)
                }),
                data_1.prisma.filtro.count({ where })
            ]);
            res.json({
                filtros,
                total,
                totalPages: Math.ceil(total / Number(limit)),
                currentPage: Number(page)
            });
        }
        catch (error) {
            console.error('Error obteniendo filtros:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    // Obtener filtro por ID
    static getFiltroById = async (req, res) => {
        try {
            const { id } = req.params;
            const filtro = await data_1.prisma.filtro.findUnique({
                where: { id: Number(id) },
                include: {
                    usuarioCreador: {
                        select: {
                            id: true,
                            nombre: true,
                            apellidos: true,
                            email: true
                        }
                    },
                    usuariosAsignados: {
                        select: {
                            id: true,
                            nombre: true,
                            apellidos: true,
                            email: true,
                            rol: true,
                            estaActivo: true
                        }
                    },
                    accesos: {
                        select: {
                            id: true,
                            nombre: true,
                            apellidos: true,
                            horaEntrada: true,
                            horaSalida: true,
                            area: true,
                            motivo: true
                        },
                        orderBy: { fechaCreacion: 'desc' },
                        take: 50
                    },
                    identificaciones: {
                        select: {
                            id: true,
                            tipo: true,
                            numero: true,
                            vigente: true
                        },
                        orderBy: { id: 'desc' },
                        take: 50
                    },
                    tias: {
                        select: {
                            id: true,
                            tipo: true,
                            fechaCreacion: true,
                            _count: {
                                select: {
                                    accesos: true
                                }
                            }
                        },
                        orderBy: { fechaCreacion: 'desc' }
                    },
                    _count: {
                        select: {
                            usuariosAsignados: true,
                            accesos: true,
                            identificaciones: true,
                            tias: true
                        }
                    }
                }
            });
            if (!filtro) {
                return res.status(404).json({ error: 'Filtro no encontrado' });
            }
            res.json(filtro);
        }
        catch (error) {
            console.error('Error obteniendo filtro:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    // Obtener filtros activos (para selects)
    static getFiltrosActivos = async (req, res) => {
        try {
            const filtros = await data_1.prisma.filtro.findMany({
                where: { estaActivo: true },
                select: {
                    id: true,
                    nombre: true,
                    descripcion: true,
                    ubicacion: true,
                    cantidad: true
                },
                orderBy: { nombre: 'asc' }
            });
            res.json(filtros);
        }
        catch (error) {
            console.error('Error obteniendo filtros activos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    // Crear nuevo filtro
    static createFiltro = async (req, res) => {
        try {
            const data = req.body;
            const usuario = req.user;
            // Validar que el nombre sea único
            const filtroExistente = await data_1.prisma.filtro.findUnique({
                where: { nombre: data.nombre }
            });
            if (filtroExistente) {
                return res.status(400).json({ error: 'Ya existe un filtro con este nombre' });
            }
            const filtro = await data_1.prisma.filtro.create({
                data: {
                    nombre: data.nombre,
                    descripcion: data.descripcion || null,
                    ubicacion: data.ubicacion || null,
                    cantidad: data.cantidad || null,
                    estaActivo: data.estaActivo ?? true,
                    usuarioCreadorId: data.usuarioCreadorId || usuario.id
                },
                include: {
                    usuarioCreador: {
                        select: {
                            id: true,
                            nombre: true,
                            apellidos: true,
                            email: true
                        }
                    },
                    _count: {
                        select: {
                            usuariosAsignados: true,
                            accesos: true,
                            identificaciones: true,
                            tias: true
                        }
                    }
                }
            });
            await data_1.prisma.auditoria.create({
                data: {
                    tipo: 'FILTRO',
                    accion: 'CREACION_FILTRO',
                    descripcion: `Usuario ${usuario.id} creó el filtro "${data.nombre}"`,
                    usuarioId: usuario.id,
                    filtroId: filtro.id
                }
            });
            res.status(201).json(filtro);
        }
        catch (error) {
            console.error('Error creando filtro:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    // Actualizar filtro
    static updateFiltro = async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;
            const filtroExistente = await data_1.prisma.filtro.findUnique({
                where: { id: Number(id) }
            });
            if (!filtroExistente) {
                return res.status(404).json({ error: 'Filtro no encontrado' });
            }
            // Validar nombre único si se está cambiando
            if (data.nombre && data.nombre !== filtroExistente.nombre) {
                const nombreExistente = await data_1.prisma.filtro.findUnique({
                    where: { nombre: data.nombre }
                });
                if (nombreExistente) {
                    return res.status(400).json({ error: 'Ya existe otro filtro con este nombre' });
                }
            }
            const filtro = await data_1.prisma.filtro.update({
                where: { id: Number(id) },
                data: {
                    ...data,
                    // No permitir cambiar usuarioCreadorId una vez creado
                    usuarioCreadorId: undefined
                },
                include: {
                    usuarioCreador: {
                        select: {
                            id: true,
                            nombre: true,
                            apellidos: true,
                            email: true
                        }
                    },
                    usuariosAsignados: {
                        select: {
                            id: true,
                            nombre: true,
                            apellidos: true,
                            email: true,
                            rol: true
                        }
                    },
                    _count: {
                        select: {
                            usuariosAsignados: true,
                            accesos: true,
                            identificaciones: true,
                            tias: true
                        }
                    }
                }
            });
            await data_1.prisma.auditoria.create({
                data: {
                    tipo: 'FILTRO',
                    accion: 'ACTUALIZACIÓN_FILTRO',
                    descripcion: `Usuario ${req.user.id} actualizó el filtro "${filtroExistente.nombre}"`,
                    usuarioId: req.user.id,
                    filtroId: Number(id)
                }
            });
            res.json(filtro);
        }
        catch (error) {
            console.error('Error actualizando filtro:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    static deleteFiltro = async (req, res) => {
        try {
            const { id } = req.params;
            const filtroExistente = await data_1.prisma.filtro.findUnique({
                where: { id: Number(id) },
                include: {
                    _count: {
                        select: {
                            usuariosAsignados: true,
                            accesos: true,
                            identificaciones: true,
                            tias: true
                        }
                    }
                }
            });
            if (!filtroExistente) {
                return res.status(404).json({ error: 'Filtro no encontrado' });
            }
            // Verificar si tiene usuarios asignados
            if (filtroExistente._count.usuariosAsignados > 0) {
                return res.status(400).json({
                    error: 'No se puede eliminar el filtro porque tiene usuarios asignados. Desasigne los usuarios primero.'
                });
            }
            // Verificar si tiene accesos asociados
            if (filtroExistente._count.accesos > 0) {
                return res.status(400).json({
                    error: 'No se puede eliminar el filtro porque tiene accesos asociados. Elimine o reasigne los accesos primero.'
                });
            }
            // Verificar si tiene identificaciones asociadas
            if (filtroExistente._count.identificaciones > 0) {
                return res.status(400).json({
                    error: 'No se puede eliminar el filtro porque tiene identificaciones asociadas. Reasigne las identificaciones primero.'
                });
            }
            // Verificar si tiene TIAS asociados
            if (filtroExistente._count.tias > 0) {
                return res.status(400).json({
                    error: 'No se puede eliminar el filtro porque tiene TIAS asociados. Reasigne los TIAS primero.'
                });
            }
            // Eliminar el filtro permanentemente
            await data_1.prisma.filtro.delete({
                where: { id: Number(id) }
            });
            await data_1.prisma.auditoria.create({
                data: {
                    tipo: 'FILTRO',
                    accion: 'ELIMINACIÓN_FILTRO',
                    descripcion: `Usuario ${req.user.id} elimino el filtro "${filtroExistente.nombre}"`,
                    usuarioId: req.user.id
                }
            });
            res.json({
                message: 'Filtro eliminado permanentemente correctamente',
                filtroEliminado: {
                    id: filtroExistente.id,
                    nombre: filtroExistente.nombre,
                    descripcion: filtroExistente.descripcion,
                    ubicacion: filtroExistente.ubicacion,
                    cantidad: filtroExistente.cantidad
                }
            });
        }
        catch (error) {
            console.error('Error eliminando filtro:', error);
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Filtro no encontrado' });
            }
            if (error.code === 'P2003') {
                return res.status(400).json({
                    error: 'No se puede eliminar el filtro porque tiene relaciones activas. Desasigne todos los usuarios, accesos, identificaciones y TIAS primero.'
                });
            }
            res.status(500).json({ error: 'Error interno del servidor al eliminar filtro' });
        }
    };
}
exports.FiltroController = FiltroController;
//# sourceMappingURL=filtro.controller.js.map