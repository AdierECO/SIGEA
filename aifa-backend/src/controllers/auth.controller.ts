import { Request, Response } from 'express';
import { prisma } from "../data";
import { bcryptjsAdapter, JwtAdapter } from '../config';
import { LoginDto } from '../types/auth.types';

export class AuthController {
  // Constantes de configuración
  private static readonly MAX_INTENTOS = 3;
  private static readonly TIEMPO_BLOQUEO_MINUTOS = 30; 

  // Método auxiliar para verificar y limpiar bloqueos expirados
  private static async verificarBloqueoExpirado(usuario: any) {
    if (usuario.bloqueadoHasta && new Date() > usuario.bloqueadoHasta) {
      // El tiempo de bloqueo ha expirado, reestablecer usuario
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { 
          bloqueadoHasta: null,
          intentosFallidos: 0,
          estaActivo: true,
          fechaActualizacion: new Date()
        }
      });

      await prisma.auditoria.create({
        data: {
          tipo: 'SISTEMA',
          accion: 'BLOQUEO_EXPIRADO',
          descripcion: `Bloqueo automático expirado para usuario ${usuario.email}`,
          usuarioId: usuario.id,
        }
      });

      return true; // Indica que se limpió el bloqueo
    }
    return false; // El bloqueo aún está activo
  }

  static login = async (req: Request, res: Response) => {
    try {
      const { email, password }: LoginDto = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email y password son requeridos' });
      }

      const usuario = await prisma.usuario.findUnique({
        where: { email }
      });

      if (!usuario) {
        return res.status(400).json({ error: 'Credenciales inválidas' });
      }

      // VERIFICAR SI EL BLOQUEO HA EXPIRADO
      const bloqueoLimpio = await this.verificarBloqueoExpirado(usuario);
      
      // Si se limpió el bloqueo, obtener el usuario actualizado
      const usuarioActual = bloqueoLimpio 
        ? await prisma.usuario.findUnique({ where: { email } })
        : usuario;

      // VERIFICAR SI EL USUARIO ESTÁ BLOQUEADO (después de la posible limpieza)
      if (usuarioActual!.bloqueadoHasta && new Date() < usuarioActual!.bloqueadoHasta) {
        const minutosRestantes = Math.ceil((usuarioActual!.bloqueadoHasta.getTime() - new Date().getTime()) / (1000 * 60));
        
        await prisma.auditoria.create({
          data: {
            tipo: 'SEGURIDAD',
            accion: 'INTENTO_BLOQUEADO',
            descripcion: `Usuario ${usuarioActual!.email} intentó acceder mientras está bloqueado. Tiempo restante: ${minutosRestantes} minutos`,
            usuarioId: usuarioActual!.id,
          }
        });

        return res.status(423).json({ 
          error: `Cuenta temporalmente bloqueada. Intente nuevamente en ${minutosRestantes} minutos.` 
        });
      }

      if (!usuarioActual!.estaActivo) {
        return res.status(400).json({ error: 'Usuario desactivado' });
      }

      const isValidPassword = await bcryptjsAdapter.compare(password, usuarioActual!.password);
      
      if (!isValidPassword) {
        // INCREMENTAR CONTADOR DE INTENTOS FALLIDOS
        const nuevosIntentos = (usuarioActual!.intentosFallidos || 0) + 1;
        
        await prisma.usuario.update({
          where: { id: usuarioActual!.id },
          data: { 
            intentosFallidos: nuevosIntentos,
            fechaActualizacion: new Date()
          }
        });

        // REGISTRAR INTENTO FALLIDO EN AUDITORÍA
        await prisma.auditoria.create({
          data: {
            tipo: 'SEGURIDAD',
            accion: 'INTENTO_SESION_FALLIDO',
            descripcion: `Intento fallido ${nuevosIntentos}/${this.MAX_INTENTOS} para usuario ${usuarioActual!.email}`,
            usuarioId: usuarioActual!.id,
          }
        });

        // BLOQUEAR USUARIO SI SUPERA EL LÍMITE
        if (nuevosIntentos >= this.MAX_INTENTOS) {
          const bloqueadoHasta = new Date();
          bloqueadoHasta.setMinutes(bloqueadoHasta.getMinutes() + this.TIEMPO_BLOQUEO_MINUTOS);

          await prisma.usuario.update({
            where: { id: usuarioActual!.id },
            data: { 
              bloqueadoHasta: bloqueadoHasta,
              intentosFallidos: 0,
              estaActivo: false
            }
          });

          await prisma.auditoria.create({
            data: {
              tipo: 'SEGURIDAD',
              accion: 'USUARIO_BLOQUEADO',
              descripcion: `Usuario ${usuarioActual!.email} bloqueado por ${this.TIEMPO_BLOQUEO_MINUTOS} minutos después de ${this.MAX_INTENTOS} intentos fallidos`,
              usuarioId: usuarioActual!.id,
            }
          });

          return res.status(423).json({ 
            error: `Demasiados intentos fallidos. Cuenta bloqueada por ${this.TIEMPO_BLOQUEO_MINUTOS} minutos.` 
          });
        }

        const intentosRestantes = this.MAX_INTENTOS - nuevosIntentos;
        return res.status(400).json({ 
          error: `Credenciales inválidas. Le quedan ${intentosRestantes} intentos.` 
        });
      }

      // LOGIN EXITOSO - REINICIAR CONTADORES
      await prisma.usuario.update({
        where: { id: usuarioActual!.id },
        data: { 
          fechaActualizacion: new Date(),
          intentosFallidos: 0, // Reiniciar contador
          bloqueadoHasta: null, // Quitar bloqueo si existía
          estaActivo: true, // Asegurar que esté activo
          ultimoAcceso: new Date() // Opcional: registrar último acceso exitoso
        }
      });

      const token = await JwtAdapter.generateToken({
        id: usuarioActual!.id,
        email: usuarioActual!.email,
        rol: usuarioActual!.rol
      });

      // REGISTRAR INICIO EXITOSO
      await prisma.auditoria.create({
        data: {
          tipo: 'SISTEMA',
          accion: 'INICIO_SESION_EXITOSO',
          descripcion: `Usuario ${usuarioActual!.email} inició sesión exitosamente`,
          usuarioId: usuarioActual!.id,
        }
      });

      const { password: _, ...usuarioSinPassword } = usuarioActual!;

      res.json({
        token,
        usuario: usuarioSinPassword,
        expira: '8h'
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  static desbloquearUsuario = async (req: Request, res: Response) => {
    try {
      const { usuarioId } = req.params;
      const adminId = (req as any).user.id;

      const usuario = await prisma.usuario.update({
        where: { id: Number(usuarioId) },
        data: {
          bloqueadoHasta: null,
          intentosFallidos: 0,
          estaActivo: true
        }
      });

      await prisma.auditoria.create({
        data: {
          tipo: 'SISTEMA',
          accion: 'USUARIO_DESBLOQUEADO',
          descripcion: `Usuario ${usuario.email} desbloqueado manualmente por administrador`,
          usuarioId: adminId,
        }
      });

      res.json({ message: 'Usuario desbloqueado exitosamente' });
    } catch (error) {
      console.error('Error desbloqueando usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}