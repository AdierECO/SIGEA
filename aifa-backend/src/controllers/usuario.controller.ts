import { Request, Response } from 'express';
import { prisma } from "../data";
import { CreateUsuarioDto, UpdateUsuarioDto } from '../types/usuario.types';
import { bcryptjsAdapter } from '../config';

export class UsuarioController {
  static getUsuarios = async (req: Request, res: Response) => {
    try {
      const usuarios = await prisma.usuario.findMany({
        select: {
          id: true,
          email: true,
          nombre: true,
          apellidos: true,
          telefono: true,
          rol: true,
          estaActivo: true,
          intentosFallidos: true,
          bloqueadoHasta: true,
          ultimoAcceso: true,
          fechaCreacion: true,
          filtroAsignado: {
            select: {
              id: true,
              nombre: true,
              descripcion: true
            }
          },
          _count: {
            select: {
              turnosCreados: true,
              turnosAsignados: true,
              accesos: true,
              filtrosCreados: true,
              backupLogs: true
            }
          }
        }
      });
      res.json(usuarios);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  static getUsuarioById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const usuario = await prisma.usuario.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellidos: true,
          telefono: true,
          rol: true,
          estaActivo: true,
          intentosFallidos: true,
          bloqueadoHasta: true,
          ultimoAcceso: true,
          fechaCreacion: true,
          fechaActualizacion: true,

          filtroAsignado: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              ubicacion: true,
              estaActivo: true
            }
          },
          filtrosCreados: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              ubicacion: true,
              estaActivo: true
            }
          },
          turnosCreados: {
            select: {
              id: true,
              nombreTurno: true,
              horaInicio: true,
              horaFin: true,
              estaActivo: true
            }
          },
          turnosAsignados: {
            select: {
              id: true,
              turno: {
                select: {
                  id: true,
                  nombreTurno: true,
                  horaInicio: true,
                  estaActivo: true
                }
              },
              fechaAsignacion: true
            }
          },
          accesos: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              area: true,
              horaEntrada: true,
              horaSalida: true
            },
            orderBy: { fechaCreacion: 'desc' },
            take: 10
          },
          backupLogs: {
            select: {
              id: true,
              tipo: true,
              descripcion: true,
              fechaCreacion: true
            },
            orderBy: { fechaCreacion: 'desc' },
            take: 5
          },
          _count: {
            select: {
              turnosCreados: true,
              turnosAsignados: true,
              accesos: true,
              filtrosCreados: true,
              backupLogs: true
            }
          }
        }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(usuario);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  static createUsuario = async (req: Request, res: Response) => {
    try {
      const data: CreateUsuarioDto = req.body;

      //Validación de email
      if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
        return res.status(400).json({ error: 'Email inválido' });
      }

      const existeUsuario = await prisma.usuario.findUnique({
        where: { email: data.email }
      });

      if (existeUsuario) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      //Validar fuerza de password
      if (!data.password || data.password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      //Validar que el filtro asignado existe si se proporciona
      if (data.filtroAsignadoId) {
        const filtroExistente = await prisma.filtro.findUnique({
          where: { id: data.filtroAsignadoId }
        });

        if (!filtroExistente) {
          return res.status(400).json({ error: 'El filtro asignado no existe' });
        }
      }

      const hashedPassword = await bcryptjsAdapter.hash(data.password);

      const usuario = await prisma.usuario.create({
        data: {
          ...data,
          password: hashedPassword
        },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellidos: true,
          telefono: true,
          rol: true,
          estaActivo: true,
          fechaCreacion: true,

          filtroAsignado: {
            select: {
              id: true,
              nombre: true,
              descripcion: true
            }
          },
          _count: {
            select: {
              turnosCreados: true,
              turnosAsignados: true,
              accesos: true,
              filtrosCreados: true
            }
          }
        }
      });
      await prisma.auditoria.create({
        data: {
          tipo: 'SISTEMA',
          accion: 'CREACION_USUARIO',
          descripcion: `Nuevo usuario creado: ${data.email}`,
          usuarioId: (req as any).user.id
        }
      });

      res.status(201).json(usuario);
    } catch (error) {
      console.error('Error creando usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  static updateUsuario = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data: UpdateUsuarioDto = req.body;
      const usuarioActual = (req as any).user; // Usuario que hace la petición

      // Buscar usuario existente
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { id: Number(id) },
        include: {
          filtroAsignado: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      });

      if (!usuarioExistente) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // ⭐ VALIDACIÓN DE PERMISOS POR ROL
      const isSelfUpdate = usuarioActual.id === usuarioExistente.id;
      const isOperativo = usuarioActual.rol === 'OPERATIVO';
      const isAdministrador = usuarioActual.rol === 'ADMINISTRADOR';
      const isSuperadmin = usuarioActual.rol === 'SUPERADMIN';

      // Si es OPERATIVO, solo puede actualizar a SÍ MISMO
      if (isOperativo && !isSelfUpdate) {
        return res.status(403).json({
          error: 'No tienes permisos para actualizar otros usuarios'
        });
      }

      // Si es OPERATIVO actualizándose a sí mismo, solo puede cambiar nombre/apellidos
      if (isOperativo && isSelfUpdate) {
        const allowedFields = ['nombre', 'apellidos'];
        const unauthorizedFields = Object.keys(data).filter(
          field => !allowedFields.includes(field)
        );

        if (unauthorizedFields.length > 0) {
          return res.status(403).json({
            error: `Operativos solo pueden actualizar: ${allowedFields.join(', ')}`
          });
        }

        // ⭐ PERMITIR CAMPOS VACÍOS para logout de cuentas compartidas
        if (data.nombre === '') {
          data.nombre = ''; // Permitir vacío
        }
        if (data.apellidos === '') {
          data.apellidos = ''; // Permitir vacío
        }
      }

      // Solo ADMINISTRADOR y SUPERADMIN pueden cambiar roles
      if (data.rol && !(isAdministrador || isSuperadmin)) {
        return res.status(403).json({
          error: 'No tienes permisos para cambiar roles'
        });
      }

      // Solo SUPERADMIN puede cambiar a SUPERADMIN
      if (data.rol === 'SUPERADMIN' && !isSuperadmin) {
        return res.status(403).json({
          error: 'Solo SUPERADMIN puede asignar rol SUPERADMIN'
        });
      }

      // Validaciones existentes (filtro, email, etc.)
      if (data.filtroAsignadoId !== undefined) {
        if (data.filtroAsignadoId) {
          const filtroExistente = await prisma.filtro.findUnique({
            where: { id: data.filtroAsignadoId }
          });

          if (!filtroExistente) {
            return res.status(400).json({ error: 'El filtro asignado no existe' });
          }
        }
      }

      if (data.email && data.email !== usuarioExistente.email) {
        const emailExistente = await prisma.usuario.findUnique({
          where: { email: data.email }
        });

        if (emailExistente) {
          return res.status(400).json({ error: 'El email ya está en uso por otro usuario' });
        }
      }

      if (data.password) {
        data.password = await bcryptjsAdapter.hash(data.password);
      }

      const usuario = await prisma.usuario.update({
        where: { id: Number(id) },
        data,
        select: {
          id: true,
          email: true,
          nombre: true,
          apellidos: true,
          telefono: true,
          rol: true,
          estaActivo: true,
          fechaCreacion: true,
          fechaActualizacion: true,
          filtroAsignado: {
            select: {
              id: true,
              nombre: true,
              descripcion: true
            }
          },
          _count: {
            select: {
              turnosCreados: true,
              turnosAsignados: true,
              accesos: true,
              filtrosCreados: true
            }
          }
        }
      });

      // Auditoría
      let accion = 'ACTUALIZACIÓN_USUARIO';
      let descripcion = `Usuario actualizado: ${usuario.email}`;
      let tipo = 'SISTEMA';

      // Si es OPERATIVO limpiando sus datos (logout de cuenta compartida)
      if (isOperativo && isSelfUpdate && (data.nombre === '' || data.apellidos === '')) {
        accion = 'LIMPIAR_DATOS_CUENTA_COMPARTIDA';
        descripcion = `Usuario OPERATIVO limpió sus datos al cerrar sesión: ${usuario.email}`;
        tipo = 'SISTEMA';
      }
      // Verificar si solo se actualizó el filtro
      else if (Object.keys(data).length === 1 && 'filtroAsignadoId' in data) {
        const filtroAnterior = usuarioExistente.filtroAsignado?.nombre || 'Sin filtro';
        const filtroNuevo = usuario.filtroAsignado?.nombre || 'Sin filtro';

        accion = 'ACTUALIZACIÓN_FILTRO_USUARIO';
        descripcion = `Filtro actualizado para ${usuario.email}: ${filtroAnterior} → ${filtroNuevo}`;
        tipo = 'FILTRO';
      }

      await prisma.auditoria.create({
        data: {
          tipo,
          accion,
          descripcion,
          usuarioId: usuarioActual.id,
          filtroId: usuario.filtroAsignado?.id || null
        }
      });

      res.json(usuario);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  static deleteUsuario = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const usuarioExistente = await prisma.usuario.findUnique({
        where: { id: Number(id) },
        include: {
          _count: {
            select: {
              turnosCreados: true,
              accesos: true,
              filtrosCreados: true,
              backupLogs: true
            }
          }
        }
      });

      if (!usuarioExistente) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (usuarioExistente.rol === 'SUPERADMIN') {
        return res.status(400).json({ error: 'No se puede eliminar un usuario Superadmin' });
      }

      if (usuarioExistente._count.turnosCreados > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar el usuario porque tiene turnos creados. Transfiera los turnos a otro usuario primero.'
        });
      }

      if (usuarioExistente._count.accesos > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar el usuario porque tiene accesos creados. Reasigne los accesos primero.'
        });
      }

      if (usuarioExistente._count.filtrosCreados > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar el usuario porque tiene filtros creados. Transfiera los filtros a otro usuario primero.'
        });
      }

      await prisma.usuario.delete({
        where: { id: Number(id) }
      });
      await prisma.auditoria.create({
        data: {
          tipo: 'SISTEMA',
          accion: 'ELIMINACION_USUARIO',
          descripcion: `Usuario eliminado: ${usuarioExistente.email}`,
          usuarioId: (req as any).user.id
        }
      });

      res.status(200).json({
        message: 'Usuario eliminado permanentemente de la base de datos',
        usuarioEliminado: {
          id: usuarioExistente.id,
          email: usuarioExistente.email,
          nombre: usuarioExistente.nombre,
          apellidos: usuarioExistente.apellidos
        }
      });

    } catch (error: any) {
      console.error('Error eliminando usuario:', error);

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      if (error.code === 'P2003') {
        return res.status(400).json({
          error: 'No se puede eliminar el usuario porque tiene registros asociados. Use desactivación en lugar de eliminación.'
        });
      }

      res.status(500).json({ error: 'Error interno del servidor al eliminar usuario' });
    }
  };
}