import { Request, Response } from 'express';
import { prisma } from "../data";
import { UpdateUsuarioDto } from '../types/usuario.types';
import { bcryptjsAdapter } from '../config';

// Interface para errores de Prisma
interface PrismaError extends Error {
  code?: string;
  meta?: any;
}

export class ProfileController {
  /**
   * Obtener el perfil del usuario autenticado
   */
  static getMiPerfil = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellidos: true,
          telefono: true,
          rol: true,
          estaActivo: true,
          fechaCreacion: true,
          fechaActualizacion: true
        }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.json(usuario);
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  /**
   * Actualizar el perfil del usuario autenticado
   */
  static updateMiPerfil = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id;
      const data: UpdateUsuarioDto = req.body;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      //  Validar campos requeridos
      if (!data.nombre?.trim() || !data.apellidos?.trim() || !data.email?.trim()) {
        return res.status(400).json({ error: 'Nombre, apellidos y email son requeridos' });
      }

      //  Validar formato de email
      if (!/\S+@\S+\.\S+/.test(data.email)) {
        return res.status(400).json({ error: 'Email inválido' });
      }

      //  Verificar que el email no esté en uso por otro usuario
      const emailExistente = await prisma.usuario.findFirst({
        where: {
          email: data.email,
          id: { not: usuarioId } // Excluir al usuario actual
        }
      });

      if (emailExistente) {
        return res.status(400).json({ error: 'El email ya está en uso por otro usuario' });
      }

      // Validar longitud de contraseña si se proporciona
      if (data.password && data.password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      // Preparar datos para actualización
      const updateData: any = {
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email,
        telefono: data.telefono || null
      };

      // Solo actualizar contraseña si se proporciona
      if (data.password) {
        updateData.password = await bcryptjsAdapter.hash(data.password);
      }

      const usuario = await prisma.usuario.update({
        where: { id: usuarioId },
        data: updateData,
        select: {
          id: true,
          email: true,
          nombre: true,
          apellidos: true,
          telefono: true,
          rol: true,
          estaActivo: true,
          fechaCreacion: true,
          fechaActualizacion: true
        }
      });
      await prisma.auditoria.create({
        data: {
          tipo: 'SISTEMA',
          accion: 'PERFIL_ACTUALIZADO',
          descripcion: `Perfil de usuario actualizado: ${data.email}`,
          usuarioId: (req as any).user.id
        }
      });

      res.json({
        message: 'Perfil actualizado exitosamente',
        usuario
      });

    } catch (error: unknown) {
      console.error('Error actualizando perfil:', error);

      // MANEJO SEGURO DEL ERROR - Sin acceder directamente a .code
      if (error instanceof Error) {
        const prismaError = error as PrismaError;
        if (prismaError.code === 'P2025') {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
      }

      // Alternativa: Verificar el mensaje de error
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  /**
   * Cambiar contraseña del usuario autenticado
   */
  static cambiarPassword = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id;
      const { passwordActual, nuevaPassword } = req.body;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!passwordActual || !nuevaPassword) {
        return res.status(400).json({ error: 'Contraseña actual y nueva contraseña son requeridas' });
      }

      if (nuevaPassword.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }

      // Obtener usuario con password para verificar
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { password: true }
      });

      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      //  Verificar contraseña actual
      const isPasswordValid = await bcryptjsAdapter.compare(passwordActual, usuario.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Contraseña actual incorrecta' });
      }

      // Actualizar contraseña
      const hashedPassword = await bcryptjsAdapter.hash(nuevaPassword);

      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { password: hashedPassword },
        select: { id: true } // Solo retornar id para confirmación
      });
      await prisma.auditoria.create({
        data: {
          tipo: 'SISTEMA',
          accion: 'CAMBIO_CONTRASEÑA',
          descripcion: `Usuario cambio ${usuario} su contraseña`,
          usuarioId: (req as any).user.id
        }
      });

      res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error: unknown) {
      console.error('Error cambiando contraseña:', error);

      // Manejo seguro de errores de Prisma
      if (error instanceof Error) {
        const prismaError = error as PrismaError;
        if (prismaError.code === 'P2025') {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }
      }

      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  /**
   * Obtener estadísticas del usuario autenticado
   */
  static getMisEstadisticas = async (req: Request, res: Response) => {
    try {
      const usuarioId = (req as any).user?.id;

      if (!usuarioId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Obtener conteo de accesos creados por el usuario
      const totalAccesos = await prisma.acceso.count({
        where: { creadoPor: usuarioId }
      });

      // Obtener accesos activos (sin salida) creados por el usuario
      const accesosActivos = await prisma.acceso.count({
        where: {
          creadoPor: usuarioId,
          horaSalida: null
        }
      });

      //  Obtener accesos del día actual
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const accesosHoy = await prisma.acceso.count({
        where: {
          creadoPor: usuarioId,
          fechaCreacion: {
            gte: hoy
          }
        }
      });

      res.json({
        totalAccesos,
        accesosActivos,
        accesosHoy,
        ratioCompletitud: totalAccesos > 0 ?
          ((totalAccesos - accesosActivos) / totalAccesos * 100).toFixed(1) + '%' : '0%'
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}