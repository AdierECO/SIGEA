import { Request, Response } from 'express';
import { prisma } from "../data";
import { CreateTurnoDto, UpdateTurnoDto, AsignarTurnoDto } from '../types/turno.types';

export class TurnoController {

  // Obtener todos los turnos con usuarios asignados y creador
  static getTurnos = async (req: Request, res: Response) => {
    try {
      const turnos = await prisma.turno.findMany({
        include: {
          creador: { select: { nombre: true, apellidos: true } },
          usuarios: { include: { usuario: { select: { nombre: true, apellidos: true } } } },
          accesos: true
        },
        orderBy: { fechaCreacion: 'desc' }
      });
      res.json(turnos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Obtener un turno por ID
  static getTurnoById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const turno = await prisma.turno.findUnique({
        where: { id: Number(id) },
        include: {
          creador: { select: { nombre: true, apellidos: true } },
          usuarios: { include: { usuario: { select: { nombre: true, apellidos: true } } } },
          accesos: true
        }
      });

      if (!turno) return res.status(404).json({ error: 'Turno no encontrado' });

      res.json(turno);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  // Crear un nuevo turno
  static createTurno = async (req: Request, res: Response) => {
    try {
      const data: CreateTurnoDto = req.body;

      const turno = await prisma.turno.create({
        data: {
          nombreTurno: data.nombreTurno,
          horaInicio: data.horaInicio || new Date(),
          horaFin: data.horaFin || null,
          estaActivo: true,
          creador: { connect: { id: data.creadoPor } }
        },
        include: { creador: { select: { nombre: true, apellidos: true } } }
      });
      await prisma.auditoria.create({
        data: {
          tipo: 'TURNO',
          accion: 'CREACION_TURNO',
          descripcion: `Nuevo turno creado: ${data.nombreTurno}`,
          usuarioId: data.creadoPor,
          turnoId: turno.id
        }
      });

      res.status(201).json(turno);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  static updateTurno = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: UpdateTurnoDto = req.body;

      const turnoExistente = await prisma.turno.findUnique({
        where: { id: Number(id) },
        include: {
          usuarios: true
        }
      });

      if (!turnoExistente) {
        return res.status(404).json({ error: 'Turno no encontrado' });
      }

      if (data.estaActivo === false && turnoExistente.estaActivo === true) {
        const result = await prisma.$transaction(async (tx) => {
          await tx.turnoUsuario.deleteMany({
            where: { turnoId: Number(id) }
          });

          const turnoActualizado = await tx.turno.update({
            where: { id: Number(id) },
            data: {
              ...data,
              horaFin: data.horaFin || new Date()
            },
            include: {
              creador: { select: { nombre: true, apellidos: true } },
              usuarios: {
                include: {
                  usuario: {
                    select: {
                      id: true,
                      nombre: true,
                      apellidos: true,
                      email: true,
                      rol: true
                    }
                  }
                }
              }
            }
          });

          return turnoActualizado;
        });

        return res.json({
          message: 'Turno cerrado y usuarios desasignados correctamente',
          turno: result
        });
      }

      const turno = await prisma.turno.update({
        where: { id: Number(id) },
        data,
        include: {
          creador: { select: { nombre: true, apellidos: true } },
          usuarios: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  apellidos: true,
                  email: true,
                  rol: true
                }
              }
            }
          }
        }
      });
      await prisma.auditoria.create({
        data: {
          tipo: 'TURNO',
          accion: 'ACTUALIZACIÓN_TURNO',
          descripcion: `Turno ${data.nombreTurno} actualizado exitosamente`,
          usuarioId: (req as any).user.id,
          turnoId: Number(id)
        }
      });

      res.json(turno);
    } catch (error) {
      console.error('Error actualizando turno:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  static asignarTurno = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { usuarioIds }: AsignarTurnoDto = req.body;
      const turno = await prisma.turno.findUnique({
        where: { id: Number(id) },
        select: { nombreTurno: true }
      });

      const asignaciones = await prisma.turnoUsuario.createMany({
        data: usuarioIds.map(usuarioId => ({
          turnoId: Number(id),
          usuarioId
        })),
        skipDuplicates: true
      });

      await prisma.auditoria.create({
        data: {
          tipo: 'TURNO',
          accion: 'ASIGNACION_USUARIOS',
          descripcion: `${usuarioIds.length} usuarios asignados al turno ${turno?.nombreTurno}`,
          usuarioId: (req as any).user.id,
          turnoId: Number(id)
        }
      });

      res.json({ message: 'Usuarios asignados al turno', asignaciones });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al asignar usuarios al turno' });
    }
  };

  static deleteTurno = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const turnoExistente = await prisma.turno.findUnique({
        where: { id: Number(id) },
        include: {
          accesos: true
        }
      });

      if (!turnoExistente) {
        return res.status(404).json({ error: 'Turno no encontrado' });
      }

      if (turnoExistente.accesos && turnoExistente.accesos.length > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar el turno porque tiene accesos asociados'
        });
      }

      await prisma.$transaction(async (tx) => {
        const turnoAEliminar = await tx.turno.findUnique({
          where: { id: Number(id) },
          select: {
            id: true,
            nombreTurno: true,
            _count: {
              select: { usuarios: true }
            }
          }
        });
        if (!turnoAEliminar) {
          throw new Error('Turno no encontrado');
        }
        await tx.turnoUsuario.deleteMany({
          where: { turnoId: Number(id) }
        });

        await tx.turno.delete({
          where: { id: Number(id) }
        });

        await tx.auditoria.create({
          data: {
            tipo: 'TURNO',
            accion: 'ELIMINACION_TURNO',
            descripcion: `Turno "${turnoAEliminar.nombreTurno}" eliminado. ${turnoAEliminar._count.usuarios} usuarios desasignados.`,
            usuarioId: (req as any).user.id
          }
        });
      });

      res.status(200).json({
        message: 'Turno eliminado correctamente'
      });

    } catch (error) {
      console.error('Error eliminando turno:', error);
      res.status(500).json({ error: 'Error al eliminar el turno' });
    }
  };

  static getTurnosActivos = async (req: Request, res: Response) => {
    try {
      const turnos = await prisma.turno.findMany({
        where: { estaActivo: true },
        include: {
          creador: { select: { nombre: true, apellidos: true } },
          usuarios: { include: { usuario: { select: { nombre: true, apellidos: true } } } }
        },
        orderBy: { fechaCreacion: 'desc' }
      });

      res.json(turnos);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  static desasignarTurno = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { usuarioIds }: AsignarTurnoDto = req.body;
      const turno = await prisma.turno.findUnique({
        where: { id: Number(id) },
        select: { nombreTurno: true }
      });

      await prisma.turnoUsuario.deleteMany({
        where: {
          turnoId: Number(id),
          usuarioId: { in: usuarioIds }
        }
      });
      await prisma.auditoria.create({
        data: {
          tipo: 'TURNO',
          accion: 'TODOS LOS TURNOS DESASIGNADOS',
          descripcion: `${usuarioIds.length} usuarios quitados del turno ${turno?.nombreTurno}`,
          usuarioId: (req as any).user.id,
          turnoId: Number(id)
        }
      });

      res.json({ message: 'Usuarios desasignados del turno' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al desasignar usuarios del turno' });
    }
  };

  static desasignarUsuarioTurno = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { usuarioId } = req.query;
      const turno = await prisma.turno.findUnique({
        where: { id: Number(id) },
        select: { nombreTurno: true }
      });

      if (!usuarioId) {
        return res.status(400).json({ error: 'El ID de usuario es requerido' });
      }

      // Validar que el turno existe
      const turnoExists = await prisma.turno.findUnique({
        where: { id: Number(id) }
      });

      if (!turnoExists) {
        return res.status(404).json({ error: 'Turno no encontrado' });
      }

      // Validar que el usuario existe
      const usuarioExists = await prisma.usuario.findUnique({
        where: { id: Number(usuarioId) }
      });

      if (!usuarioExists) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Validar que el usuario está asignado al turno
      const asignacionExists = await prisma.turnoUsuario.findUnique({
        where: {
          turnoId_usuarioId: {
            turnoId: Number(id),
            usuarioId: Number(usuarioId)
          }
        }
      });

      if (!asignacionExists) {
        return res.status(400).json({ error: 'El usuario no está asignado a este turno' });
      }

      await prisma.turnoUsuario.delete({
        where: {
          turnoId_usuarioId: {
            turnoId: Number(id),
            usuarioId: Number(usuarioId)
          }
        }
      });
      await prisma.auditoria.create({
        data: {
          tipo: 'TURNO',
          accion: 'TODOS LOS TURNOS DESASIGNADOS',
          descripcion: `${usuarioId.length} usuario quitado del turno ${turno?.nombreTurno}`,
          usuarioId: (req as any).user.id,
          turnoId: Number(id)
        }
      });

      res.json({
        message: 'Usuario desasignado del turno exitosamente',
        usuarioDesasignado: {
          id: Number(usuarioId),
          nombre: usuarioExists.nombre,
          apellidos: usuarioExists.apellidos
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al desasignar usuario del turno' });
    }
  };
}