import type { Turno, Usuario, Identificacion, Filtro, TIAS } from "./index";

export interface Acceso {
  id: number;
  nombre?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
  empresa?: string | null;
  motivo: string;
  area?: string | null;
  registradoPor?: string | null;
  identificacionId?: number | null;
  tiasId?: string | null;
  creadoPor: number;
  turnoId?: number | null;
  filtroId?: number | null;
  tieneAcompanante: boolean;
  nombreAcompanante?: string | null;
  direccionAcompanante?: string | null;
  conGrupo: boolean;
  cantidadGrupo?: number | null;
  horaEntrada: Date;
  horaSalida?: Date | null;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  creador?: Usuario;
  turno?: Turno | null; 
  identificacion?: Identificacion | null;
  tias?: TIAS | null;
  filtro?: Filtro | null;
}

export interface CreateAccesoDto {
  nombre?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
  empresa?: string | null;
  motivo: string;
  area?: string | null;
  registradoPor?: string | null;
  identificacionId?: number | null;
  tiasId?: string | null;
  creadoPor: number;
  turnoId?: number | null;
  filtroId?: number | null;
  tieneAcompanante?: boolean;
  nombreAcompanante?: string | null;
  direccionAcompanante?: string | null;
  conGrupo?: boolean;
  cantidadGrupo?: number | null;
  horaEntrada?: Date;
}

export interface UpdateAccesoDto {
  nombre?: string | null;
  apellidos?: string | null;
  telefono?: string | null;
  empresa?: string | null;
  motivo?: string;
  area?: string | null;
  registradoPor?: string | null;
  identificacionId?: number | null;
  tiasId?: string | null;
  turnoId?: number | null;
  filtroId?: number | null;
  tieneAcompanante?: boolean;
  nombreAcompanante?: string | null;
  direccionAcompanante?: string | null;
  conGrupo?: boolean;
  cantidadGrupo?: number | null;
  horaSalida?: Date | null;
}