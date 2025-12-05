import { Acceso, Usuario } from "@prisma/client";

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
