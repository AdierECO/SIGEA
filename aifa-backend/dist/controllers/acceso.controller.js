"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccesoController = void 0;
const data_1 = require("../data");
class AccesoController {
    static getAccesos = async (req, res) => {
        try {
            const { page = 1, limit = 50, search } = req.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = search ? {
                OR: [
                    { nombre: { contains: search, mode: 'insensitive' } },
                    { apellidos: { contains: search, mode: 'insensitive' } },
                    { empresa: { contains: search, mode: 'insensitive' } },
                    { nombreAcompanante: { contains: search, mode: 'insensitive' } },
                    { registradoPor: { contains: search, mode: 'insensitive' } },
                    {
                        identificacion: {
                            numero: { contains: search, mode: 'insensitive' }
                        }
                    },
                    {
                        tias: {
                            id: { contains: search, mode: 'insensitive' }
                        }
                    }
                ]
            } : {};
            const [accesos, total] = await Promise.all([
                data_1.prisma.acceso.findMany({
                    where,
                    include: {
                        creador: {
                            select: { nombre: true, apellidos: true }
                        },
                        turno: {
                            select: {
                                id: true,
                                nombreTurno: true,
                                horaInicio: true,
                                horaFin: true
                            }
                        },
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
                                estado: true
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
                    orderBy: { fechaCreacion: 'desc' },
                    skip,
                    take: Number(limit)
                }),
                data_1.prisma.acceso.count({ where })
            ]);
            res.json({
                accesos,
                total,
                totalPages: Math.ceil(total / Number(limit)),
                currentPage: Number(page)
            });
        }
        catch (error) {
            console.error('Error en getAccesos:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    static getAccesoById = async (req, res) => {
        try {
            const { id } = req.params;
            const acceso = await data_1.prisma.acceso.findUnique({
                where: { id: Number(id) },
                include: {
                    creador: {
                        select: { nombre: true, apellidos: true }
                    },
                    turno: {
                        select: {
                            id: true,
                            nombreTurno: true,
                            horaInicio: true,
                            horaFin: true
                        }
                    },
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
                            estado: true,
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
                            nombre: true,
                            descripcion: true,
                            ubicacion: true,
                            estaActivo: true
                        }
                    }
                }
            });
            if (!acceso) {
                return res.status(404).json({ error: 'Acceso no encontrado' });
            }
            res.json(acceso);
        }
        catch (error) {
            console.error('Error en getAccesoById:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
    static createAcceso = async (req, res) => {
        try {
            const data = req.body;
            console.log('Datos recibidos para crear acceso:', data);
            // Validación de campos obligatorios
            if (!data.motivo?.trim()) {
                return res.status(400).json({ error: 'El motivo es obligatorio' });
            }
            if (!data.creadoPor) {
                return res.status(400).json({ error: 'El usuario creador es obligatorio' });
            }
            // Validación de acompañante
            if (data.tieneAcompanante === true) {
                if (!data.nombreAcompanante?.trim() || !data.direccionAcompanante?.trim()) {
                    return res.status(400).json({
                        error: 'Cuando tiene acompañante, nombreAcompanante y direccionAcompanante son obligatorios'
                    });
                }
            }
            // Validar que el usuario creador existe
            const creadorExists = await data_1.prisma.usuario.findUnique({
                where: { id: data.creadoPor, estaActivo: true }
            });
            if (!creadorExists) {
                return res.status(400).json({ error: 'El usuario creador no existe o está inactivo' });
            }
            //Verificar que el TIAS esté disponible (estado: true)
            if (data.tiasId && data.tiasId.trim()) {
                const tiasExistente = await data_1.prisma.tIAS.findUnique({
                    where: { id: data.tiasId }
                });
                if (!tiasExistente) {
                    return res.status(400).json({ error: 'El TIAS especificado no existe' });
                }
                if (!tiasExistente.estado) {
                    return res.status(400).json({
                        error: 'El TIAS seleccionado no está disponible. Por favor seleccione otro TIAS.'
                    });
                }
            }
            // Preparar datos para crear el acceso
            const accesoData = {
                nombre: data.nombre?.trim() || null,
                apellidos: data.apellidos?.trim() || null,
                telefono: data.telefono?.trim() || null,
                empresa: data.empresa?.trim() || null,
                motivo: data.motivo.trim(),
                area: data.area?.trim() || null,
                registradoPor: data.registradoPor?.trim() || null,
                creadoPor: data.creadoPor,
                tieneAcompanante: data.tieneAcompanante ?? false,
                conGrupo: data.conGrupo ?? false,
                cantidadGrupo: data.cantidadGrupo || null,
                horaEntrada: data.horaEntrada ? new Date(data.horaEntrada) : new Date()
            };
            // Manejar identificación
            if (data.identificacionId && data.identificacionId > 0) {
                const identificacionExists = await data_1.prisma.identificacion.findUnique({
                    where: { id: data.identificacionId }
                });
                if (!identificacionExists) {
                    return res.status(400).json({ error: 'La identificación no existe' });
                }
                accesoData.identificacionId = data.identificacionId;
            }
            // Manejar TIAS
            if (data.tiasId && data.tiasId.trim()) {
                const tiasExists = await data_1.prisma.tIAS.findUnique({
                    where: { id: data.tiasId }
                });
                if (!tiasExists) {
                    return res.status(400).json({ error: 'El TIAS especificado no existe' });
                }
                accesoData.tiasId = data.tiasId;
            }
            // Manejar turno
            if (data.turnoId && data.turnoId > 0) {
                const turnoExists = await data_1.prisma.turno.findUnique({
                    where: { id: data.turnoId, estaActivo: true }
                });
                if (!turnoExists) {
                    return res.status(400).json({ error: 'El turno especificado no existe o está inactivo' });
                }
                accesoData.turnoId = data.turnoId;
            }
            // Manejar filtro
            if (data.filtroId && data.filtroId > 0) {
                const filtroExists = await data_1.prisma.filtro.findUnique({
                    where: { id: data.filtroId, estaActivo: true }
                });
                if (!filtroExists) {
                    return res.status(400).json({ error: 'El filtro especificado no existe o está inactivo' });
                }
                accesoData.filtroId = data.filtroId;
            }
            // Manejar datos de acompañante
            if (data.tieneAcompanante === true) {
                accesoData.nombreAcompanante = data.nombreAcompanante?.trim();
                accesoData.direccionAcompanante = data.direccionAcompanante?.trim();
            }
            else {
                accesoData.nombreAcompanante = null;
                accesoData.direccionAcompanante = null;
            }
            console.log('Datos finales para crear acceso:', accesoData);
            // Crear el acceso y actualizar el estado de la TIAS en una transacción
            const [acceso] = await data_1.prisma.$transaction([
                // Crear el acceso
                data_1.prisma.acceso.create({
                    data: accesoData,
                    include: {
                        creador: {
                            select: { nombre: true, apellidos: true }
                        },
                        turno: {
                            select: {
                                id: true,
                                nombreTurno: true,
                                horaInicio: true,
                                horaFin: true
                            }
                        },
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
                                estado: true
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
                    }
                }),
                //ACTUALIZAR ESTADO DE LA TIAS A OCUPADA
                ...(data.tiasId ? [data_1.prisma.tIAS.update({
                        where: { id: data.tiasId },
                        data: { estado: false } // Cambiar a ocupada
                    })] : [])
            ]);
            // Registrar en auditoría
            await data_1.prisma.auditoria.create({
                data: {
                    tipo: 'ACCESO',
                    accion: 'REGISTRO_ENTRADA',
                    descripcion: `Nuevo acceso registrado para ${data.nombre || 'N/A'} ${data.apellidos || 'N/A'} por ${data.registradoPor || 'sistema'}`,
                    usuarioId: data.creadoPor,
                    accesoId: acceso.id,
                    filtroId: acceso.filtroId || null,
                    identificacionId: acceso.identificacionId || null,
                    tiasId: acceso.tiasId || null
                }
            });
            res.status(201).json(acceso);
        }
        catch (error) {
            console.error('Error creating acceso:', error);
            // Manejar error de TIAS duplicado específicamente
            if (error.code === 'P2002' && error.meta?.target?.includes('tiasId')) {
                return res.status(400).json({
                    error: 'El TIAS seleccionado ya está en uso. Por favor seleccione otro TIAS disponible.'
                });
            }
            res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    static updateAcceso = async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;
            const accesoExistente = await data_1.prisma.acceso.findUnique({
                where: { id: Number(id) }
            });
            if (!accesoExistente) {
                return res.status(404).json({ error: 'Acceso no encontrado' });
            }
            // Validación de acompañante
            if (data.tieneAcompanante === true) {
                const nombreAcompanante = data.nombreAcompanante || accesoExistente.nombreAcompanante;
                const direccionAcompanante = data.direccionAcompanante || accesoExistente.direccionAcompanante;
                if (!nombreAcompanante?.trim() || !direccionAcompanante?.trim()) {
                    return res.status(400).json({
                        error: 'Cuando tiene acompañante, nombreAcompanante y direccionAcompanante son obligatorios'
                    });
                }
            }
            // NUEVA VALIDACIÓN: Verificar que el TIAS esté disponible (solo si se está cambiando)
            if (data.tiasId && data.tiasId.trim() && data.tiasId !== accesoExistente.tiasId) {
                const tiasExistente = await data_1.prisma.tIAS.findUnique({
                    where: { id: data.tiasId }
                });
                if (!tiasExistente) {
                    return res.status(400).json({ error: 'El TIAS especificado no existe' });
                }
                if (!tiasExistente.estado) {
                    return res.status(400).json({
                        error: 'El TIAS seleccionado no está disponible. Por favor seleccione otro TIAS.'
                    });
                }
            }
            // Preparar datos de actualización
            const updateData = {};
            // Campos básicos
            if (data.nombre !== undefined)
                updateData.nombre = data.nombre?.trim() || null;
            if (data.apellidos !== undefined)
                updateData.apellidos = data.apellidos?.trim() || null;
            if (data.telefono !== undefined)
                updateData.telefono = data.telefono?.trim() || null;
            if (data.empresa !== undefined)
                updateData.empresa = data.empresa?.trim() || null;
            if (data.motivo !== undefined)
                updateData.motivo = data.motivo.trim();
            if (data.area !== undefined)
                updateData.area = data.area?.trim() || null;
            if (data.registradoPor !== undefined)
                updateData.registradoPor = data.registradoPor?.trim() || null;
            if (data.horaSalida !== undefined)
                updateData.horaSalida = data.horaSalida ? new Date(data.horaSalida) : null;
            if (data.conGrupo !== undefined)
                updateData.conGrupo = data.conGrupo;
            if (data.cantidadGrupo !== undefined)
                updateData.cantidadGrupo = data.cantidadGrupo;
            // Manejar relaciones con IDs directos (forma consistente)
            if (data.identificacionId !== undefined) {
                if (data.identificacionId && data.identificacionId > 0) {
                    const identificacionExists = await data_1.prisma.identificacion.findUnique({
                        where: { id: data.identificacionId }
                    });
                    if (!identificacionExists) {
                        return res.status(400).json({ error: 'La identificación no existe' });
                    }
                    updateData.identificacionId = data.identificacionId;
                }
                else {
                    updateData.identificacionId = null;
                }
            }
            // Manejar TIAS
            if (data.tiasId !== undefined) {
                if (data.tiasId && data.tiasId.trim()) {
                    const tiasExists = await data_1.prisma.tIAS.findUnique({
                        where: { id: data.tiasId }
                    });
                    if (!tiasExists) {
                        return res.status(400).json({ error: 'El TIAS especificado no existe' });
                    }
                    updateData.tiasId = data.tiasId;
                }
                else {
                    updateData.tiasId = null;
                }
            }
            if (data.turnoId !== undefined) {
                if (data.turnoId && data.turnoId > 0) {
                    const turnoExists = await data_1.prisma.turno.findUnique({
                        where: { id: data.turnoId, estaActivo: true }
                    });
                    if (!turnoExists) {
                        return res.status(400).json({ error: 'El turno especificado no existe o está inactivo' });
                    }
                    updateData.turnoId = data.turnoId;
                }
                else {
                    updateData.turnoId = null;
                }
            }
            if (data.filtroId !== undefined) {
                if (data.filtroId && data.filtroId > 0) {
                    const filtroExists = await data_1.prisma.filtro.findUnique({
                        where: { id: data.filtroId, estaActivo: true }
                    });
                    if (!filtroExists) {
                        return res.status(400).json({ error: 'El filtro especificado no existe o está inactivo' });
                    }
                    updateData.filtroId = data.filtroId;
                }
                else {
                    updateData.filtroId = null;
                }
            }
            // Manejar acompañante
            if (data.tieneAcompanante !== undefined) {
                updateData.tieneAcompanante = data.tieneAcompanante;
                if (data.tieneAcompanante === true) {
                    updateData.nombreAcompanante = data.nombreAcompanante?.trim() || accesoExistente.nombreAcompanante;
                    updateData.direccionAcompanante = data.direccionAcompanante?.trim() || accesoExistente.direccionAcompanante;
                }
                else {
                    updateData.nombreAcompanante = null;
                    updateData.direccionAcompanante = null;
                }
            }
            // Actualizar el acceso y manejar cambios de TIAS en una transacción
            const operations = [
                // Actualizar el acceso
                data_1.prisma.acceso.update({
                    where: { id: Number(id) },
                    data: updateData,
                    include: {
                        creador: {
                            select: { nombre: true, apellidos: true }
                        },
                        turno: {
                            select: {
                                id: true,
                                nombreTurno: true,
                                horaInicio: true,
                                horaFin: true
                            }
                        },
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
                                estado: true
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
                    }
                })
            ];
            // Manejar cambios de TIAS
            if (data.tiasId !== undefined && data.tiasId !== accesoExistente.tiasId) {
                // Liberar la TIAS anterior si existía
                if (accesoExistente.tiasId) {
                    operations.push(data_1.prisma.tIAS.update({
                        where: { id: accesoExistente.tiasId },
                        data: { estado: true } // Liberar TIAS anterior
                    }));
                }
                // Ocupar la nueva TIAS si se asignó una
                if (data.tiasId && data.tiasId.trim()) {
                    operations.push(data_1.prisma.tIAS.update({
                        where: { id: data.tiasId },
                        data: { estado: false } // Ocupar nueva TIAS
                    }));
                }
            }
            const [acceso] = await data_1.prisma.$transaction(operations);
            // Registrar en auditoría
            await data_1.prisma.auditoria.create({
                data: {
                    tipo: 'ACCESO',
                    accion: 'ACTUALIZACION_ACCESO',
                    descripcion: `Acceso ${id} actualizado. Registrado por: ${data.registradoPor || accesoExistente.registradoPor || 'sistema'}`,
                    usuarioId: req.user?.id || accesoExistente.creadoPor,
                    accesoId: Number(id),
                    filtroId: acceso.filtroId || null,
                    tiasId: acceso.tiasId || null
                }
            });
            res.json(acceso);
        }
        catch (error) {
            console.error('Error updating acceso:', error);
            // Manejar error de TIAS duplicado específicamente
            if (error.code === 'P2002' && error.meta?.target?.includes('tiasId')) {
                return res.status(400).json({
                    error: 'El TIAS seleccionado ya está en uso. Por favor seleccione otro TIAS disponible.'
                });
            }
            res.status(500).json({
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    };
    static registrarSalida = async (req, res) => {
        try {
            const { id } = req.params;
            const accesoExistente = await data_1.prisma.acceso.findUnique({
                where: { id: Number(id) }
            });
            if (!accesoExistente) {
                return res.status(404).json({ error: 'Acceso no encontrado' });
            }
            if (accesoExistente.horaSalida) {
                return res.status(400).json({ error: 'El acceso ya tiene registrada una hora de salida' });
            }
            // Registrar salida y liberar TIAS en una transacción
            const [acceso] = await data_1.prisma.$transaction([
                // Registrar salida
                data_1.prisma.acceso.update({
                    where: { id: Number(id) },
                    data: { horaSalida: new Date() },
                    include: {
                        creador: {
                            select: { nombre: true, apellidos: true }
                        },
                        turno: {
                            select: {
                                id: true,
                                nombreTurno: true,
                                horaInicio: true,
                                horaFin: true
                            }
                        },
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
                                estado: true
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
                    }
                }),
                // ACTUALIZAR ESTADO DE LA TIAS A DISPONIBLE
                ...(accesoExistente.tiasId ? [data_1.prisma.tIAS.update({
                        where: { id: accesoExistente.tiasId },
                        data: { estado: true } // Cambiar a disponible
                    })] : [])
            ]);
            await data_1.prisma.auditoria.create({
                data: {
                    tipo: 'ACCESO',
                    accion: 'REGISTRO_SALIDA',
                    descripcion: `Salida registrada para acceso ${id} registrado por ${accesoExistente.registradoPor || 'sistema'}`,
                    usuarioId: req.user?.id || accesoExistente.creadoPor,
                    accesoId: Number(id),
                    filtroId: accesoExistente.filtroId,
                    tiasId: accesoExistente.tiasId || null
                }
            });
            res.json(acceso);
        }
        catch (error) {
            console.error('Error en registrarSalida:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    };
}
exports.AccesoController = AccesoController;
//# sourceMappingURL=acceso.controller.js.map