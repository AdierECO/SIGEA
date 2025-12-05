import type { Usuario, Acceso } from './index';

export interface Turno {
  id: number;
  nombreTurno: string;
  horaInicio: Date;
  horaFin?: Date;
  estaActivo: boolean;
  creadoPor: number;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  creador?: Usuario;
  accesos?: Acceso[];
  usuarios?: {
    id: number;
    turnoId: number;
    usuarioId: number;
    fechaAsignacion: Date;
    usuario: Usuario;
  }[];
}

export interface CreateTurnoDto {
  nombreTurno: string;
  horaInicio: Date;
  horaFin?: Date;
  creadoPor: number;
  usuarioIds?: number[];
}

export interface UpdateTurnoDto {
  nombreTurno?: string;
  horaInicio?: Date;
  horaFin?: Date;
  estaActivo?: boolean;
}

export interface AsignarTurnoDto {
  usuarioIds: number[];
}

// Opcional: Interface para la relación TurnoUsuario
export interface TurnoUsuario {
  id: number;
  turnoId: number;
  usuarioId: number;
  fechaAsignacion: Date;
  turno?: Turno;
  usuario?: Usuario;
}

// Opcional: Interface extendida para respuestas con counts
export interface TurnoConDetalles extends Turno {
  _count?: {
    usuarios: number;
    accesos: number;
  };
}