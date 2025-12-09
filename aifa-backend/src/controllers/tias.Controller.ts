import { Request, Response } from 'express';
import { prisma } from "../data";
import { CreateTIASDto, UpdateTIASDto, CreateTIASRangoDto } from '../types/tias.types';

export class TIASController {
  // Obtener todos los TIAS
  static getTIAS = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 50, search, tipo, filtroId } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};

      if (search) {
        where.OR = [
          { id: { contains: search as string, mode: 'insensitive' } },
          { tipo: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      if (tipo) {
        where.tipo = tipo;
      }

      if (filtroId && filtroId !== 'todos') {
        where.filtroId = Number(filtroId);
      }

      const [tias, total] = await Promise.all([
        prisma.tIAS.findMany({
          where,
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
              },
              orderBy: { fechaCreacion: 'desc' },
              take: 5
            },
            _count: {
              select: { accesos: true }
            }
          },
          orderBy: { fechaCreacion: 'desc' },
          skip,
          take: Number(limit)
        }),
        prisma.tIAS.count({ where })
      ]);

      res.json({
        tias,
        total,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page)
      });
    } catch (error) {
      console.error('Error obteniendo TIAS:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Obtener TIAS por ID
  static getTIASById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const tias = await prisma.tIAS.findUnique({
        where: { id },
        include: {
          filtro: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              ubicacion: true
            }
          },
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
          _count: {
            select: { accesos: true }
          }
        }
      });

      if (!tias) {
        return res.status(404).json({ error: 'TIAS no encontrado' });
      }

      res.json(tias);
    } catch (error) {
      console.error('Error obteniendo TIAS:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Crear nuevo TIAS (individual)
  static createTIAS = async (req: Request, res: Response) => {
    try {
      const data: CreateTIASDto = req.body;
      const usuario = (req as any).user;

      // Validar que el ID sea único
      const tiasExistente = await prisma.tIAS.findUnique({
        where: { id: data.id }
      });

      if (tiasExistente) {
        return res.status(400).json({ error: 'Ya existe un TIAS con este ID' });
      }

      // Validar que el tipo tenga máximo 5 caracteres
      if (data.tipo && data.tipo.length > 5) {
        return res.status(400).json({ error: 'El tipo no puede tener más de 5 caracteres' });
      }

      // Validar filtro si se proporciona
      if (data.filtroId) {
        const filtroExistente = await prisma.filtro.findUnique({
          where: { id: data.filtroId }
        });

        if (!filtroExistente) {
          return res.status(400).json({ error: 'El filtro especificado no existe' });
        }
      }

      const tias = await prisma.tIAS.create({
        data: {
          id: data.id,
          tipo: data.tipo,
          estado: data.estado !== undefined ? data.estado : true,
          filtroId: data.filtroId || null
        },
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

      // Registrar en auditoría
      await prisma.auditoria.create({
        data: {
          tipo: 'TIAS',
          accion: 'CREACION_GIA',
          descripcion: `Nueva GIA creado: ${data.id} - ${data.tipo}`,
          usuarioId: usuario.id,
          tiasId: tias.id,
          filtroId: tias.filtroId
        }
      });

      res.status(201).json(tias);
    } catch (error) {
      console.error('Error creando TIAS:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Crear múltiples TIAS por rango
  static createTIASRango = async (req: Request, res: Response) => {
    try {
      const { inicio, fin, tipo, filtroId, prefijo, estado }: CreateTIASRangoDto = req.body;
      const usuario = (req as any).user;

      // Validaciones
      if (inicio === undefined || fin === undefined || !tipo) {
        return res.status(400).json({
          error: 'Los campos inicio, fin y tipo son requeridos'
        });
      }

      if (inicio > fin) {
        return res.status(400).json({
          error: 'El inicio no puede ser mayor al fin'
        });
      }

      const cantidad = fin - inicio + 1;
      if (cantidad > 1000) {
        return res.status(400).json({
          error: 'No se pueden crear más de 1000 TIAS a la vez'
        });
      }

      if (tipo.length > 5) {
        return res.status(400).json({
          error: 'El tipo no puede tener más de 5 caracteres'
        });
      }

      // Validar filtro si se proporciona - CONVERTIR A NÚMERO
      let filtroIdNum: number | null = null;
      if (filtroId) {
        filtroIdNum = Number(filtroId);
        const filtroExistente = await prisma.filtro.findUnique({
          where: { id: filtroIdNum }
        });
        if (!filtroExistente) {
          return res.status(400).json({ error: 'El filtro especificado no existe' });
        }
      }

      // Generar IDs únicos
      const tiasACrear = [];
      const tiasExistentes = [];

      for (let i = inicio; i <= fin; i++) {
        const id = prefijo ? `${prefijo}${i.toString().padStart(3, '0')}` : i.toString();

        // Verificar si ya existe
        const existe = await prisma.tIAS.findUnique({
          where: { id }
        });

        if (existe) {
          tiasExistentes.push(id);
        } else {
          tiasACrear.push({
            id,
            tipo,
            estado: estado !== undefined ? estado : true,
            filtroId: filtroIdNum 
          });
        }
      }

      // Crear los TIAS que no existen
      let resultadoCreacion: any = { count: 0 };
      if (tiasACrear.length > 0) {
        resultadoCreacion = await prisma.tIAS.createMany({
          data: tiasACrear,
          skipDuplicates: true
        });

        // Registrar en auditoría
        await prisma.auditoria.create({
          data: {
            tipo: 'TIAS',
            accion: 'CREACION_MASIVA_GIAS',
            descripcion: `Se crearon ${resultadoCreacion.count} GIAS en el rango ${inicio}-${fin} (tipo: ${tipo})`,
            usuarioId: usuario.id,
            filtroId: filtroIdNum 
          }
        });
      }

      res.status(201).json({
        success: true,
        message: `Proceso de creación masiva completado`,
        detalles: {
          totalSolicitados: cantidad,
          creados: tiasACrear.length,
          existentes: tiasExistentes.length,
          tiasCreados: resultadoCreacion.count || 0,
          idsExistentes: tiasExistentes,
          rango: `${inicio} - ${fin}`,
          tipo,
          prefijo: prefijo || 'Ninguno',
          estado: estado !== undefined ? estado : true
        }
      });

    } catch (error) {
      console.error('Error creando TIAS por rango:', error);
      res.status(500).json({
        error: 'Error interno del servidor durante la creación masiva'
      });
    }
  };

  // Actualizar TIAS
  static updateTIAS = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: UpdateTIASDto = req.body;
      const usuario = (req as any).user;

      const tiasExistente = await prisma.tIAS.findUnique({
        where: { id },
        include: {
          filtro: {
            select: { id: true, nombre: true }
          }
        }
      });

      if (!tiasExistente) {
        return res.status(404).json({ error: 'TIAS no encontrado' });
      }

      // Validar que el tipo tenga máximo 5 caracteres
      if (data.tipo && data.tipo.length > 5) {
        return res.status(400).json({ error: 'El tipo no puede tener más de 5 caracteres' });
      }

      // Validar filtro si se proporciona
      if (data.filtroId !== undefined) {
        if (data.filtroId) {
          const filtroExistente = await prisma.filtro.findUnique({
            where: { id: data.filtroId }
          });

          if (!filtroExistente) {
            return res.status(400).json({ error: 'El filtro especificado no existe' });
          }
        }
      }

      const updateData: any = {};

      if (data.tipo !== undefined) updateData.tipo = data.tipo;
      if (data.estado !== undefined) updateData.estado = data.estado;
      if (data.filtroId !== undefined) {
        updateData.filtroId = data.filtroId || null;
      }

      const tias = await prisma.tIAS.update({
        where: { id },
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

      // Registrar en auditoría
      await prisma.auditoria.create({
        data: {
          tipo: 'TIAS',
          accion: 'ACTUALIZACION_GIAS',
          descripcion: `GIA ${id} actualizado`,
          usuarioId: usuario.id,
          tiasId: id,
          filtroId: tias.filtroId
        }
      });

      res.json(tias);
    } catch (error) {
      console.error('Error actualizando TIAS:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Eliminar TIAS
  static deleteTIAS = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const usuario = (req as any).user;

      const tiasExistente = await prisma.tIAS.findUnique({
        where: { id },
        include: {
          filtro: {
            select: { id: true, nombre: true }
          },
          _count: {
            select: { accesos: true }
          }
        }
      });

      if (!tiasExistente) {
        return res.status(404).json({ error: 'TIAS no encontrado' });
      }

      // Verificar si tiene accesos asociados
      if (tiasExistente._count.accesos > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar el TIAS porque tiene accesos asociados. Elimine o reasigne los accesos primero.'
        });
      }

      // Eliminar el TIAS
      await prisma.tIAS.delete({
        where: { id }
      });

      // Registrar en auditoría
      await prisma.auditoria.create({
        data: {
          tipo: 'TIAS',
          accion: 'ELIMINACION_GIA',
          descripcion: `GIA ${id} eliminada`,
          usuarioId: usuario.id,
          filtroId: tiasExistente.filtroId
        }
      });

      res.json({
        message: 'TIAS eliminado exitosamente',
        tiasEliminado: {
          id: tiasExistente.id,
          tipo: tiasExistente.tipo,
          filtro: tiasExistente.filtro?.nombre
        }
      });
    } catch (error: any) {
      console.error('Error eliminando TIAS:', error);

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'TIAS no encontrado' });
      }

      if (error.code === 'P2003') {
        return res.status(400).json({
          error: 'No se puede eliminar el TIAS porque tiene relaciones activas. Elimine todos los accesos asociados primero.'
        });
      }

      res.status(500).json({ error: 'Error interno del servidor al eliminar TIAS' });
    }
  };

  // Obtener TIAS disponibles (que no están siendo usados en accesos activos)
  static getTIASDisponibles = async (req: Request, res: Response) => {
    try {
      const { filtroId } = req.query;

      console.log('🔍 Buscando TIAS disponibles para filtro:', filtroId);

      // Construir el filtro WHERE - SOLO TIAS DISPONIBLES (estado: true)
      const where: any = {
        estado: true // Solo TIAS disponibles
      };

      // Si se especifica un filtro, agregarlo
      if (filtroId && filtroId !== 'todos') {
        where.filtroId = Number(filtroId);
      }

      const tias = await prisma.tIAS.findMany({
        where,
        select: {
          id: true,
          tipo: true,
          estado: true,
          filtro: {
            select: {
              id: true,
              nombre: true
            }
          },
          _count: {
            select: { accesos: true }
          }
        },
        orderBy: { id: 'asc' }
      });

      console.log(`TIAS disponibles: ${tias.length}`);

      // Obtener estadísticas de TIAS en uso para información adicional
      const tiasEnUso = await prisma.tIAS.count({
        where: {
          estado: false // TIAS ocupadas
        }
      });

      res.json({
        tias,
        estadisticas: {
          totalDisponibles: tias.length,
          totalEnUso: tiasEnUso,
          totalTIAS: tias.length + tiasEnUso
        }
      });

    } catch (error) {
      console.error('Error obteniendo TIAS disponibles:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Obtener estadísticas de TIAS
  static getEstadisticasTIAS = async (req: Request, res: Response) => {
    try {
      const [totalTIAS, tiasActivos, tiasInactivos, tiasConAccesos, tiasSinAccesos, tiasPorFiltro] = await Promise.all([
        prisma.tIAS.count(),
        prisma.tIAS.count({ where: { estado: true } }),
        prisma.tIAS.count({ where: { estado: false } }),
        prisma.tIAS.count({
          where: {
            accesos: {
              some: {}
            }
          }
        }),
        prisma.tIAS.count({
          where: {
            accesos: {
              none: {}
            }
          }
        }),
        prisma.tIAS.groupBy({
          by: ['filtroId'],
          where: {
            filtroId: { not: null }
          },
          _count: {
            id: true
          }
        })
      ]);

      res.json({
        totalTIAS,
        tiasActivos,
        tiasInactivos,
        tiasConAccesos,
        tiasSinAccesos,
        tiasPorFiltro: tiasPorFiltro.map(item => ({
          filtroId: item.filtroId,
          cantidad: item._count.id
        })),
        porcentajeUtilizacion: totalTIAS > 0 ? (tiasConAccesos / totalTIAS * 100).toFixed(1) + '%' : '0%',
        porcentajeActivos: totalTIAS > 0 ? (tiasActivos / totalTIAS * 100).toFixed(1) + '%' : '0%'
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas de TIAS:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}