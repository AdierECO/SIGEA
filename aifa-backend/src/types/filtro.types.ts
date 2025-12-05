import { Acceso, Usuario, Identificacion, TIAS } from "@prisma/client";

export interface Filtro {
  id: number;
  nombre: string;
  descripcion?: string | null;
  ubicacion?: string | null;
  cantidad?: number | null;
  estaActivo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  
  // Relaciones
  usuarioCreadorId?: number | null;
  usuarioCreador?: Usuario | null;
  usuariosAsignados?: Usuario[];
  accesos?: Acceso[];
  identificaciones?: Identificacion[];
  tias?: TIAS[];
}

export interface CreateFiltroDto {
  nombre: string;
  descripcion?: string | null;
  ubicacion?: string | null;
  cantidad?: number | null;
  estaActivo?: boolean;
  usuarioCreadorId?: number | null;
}

export interface UpdateFiltroDto {
  nombre?: string;
  descripcion?: string | null;
  ubicacion?: string | null;
  cantidad?: number | null;
  estaActivo?: boolean;
  usuarioCreadorId?: number | null;
}

export interface AsignarUsuariosFiltroDto {
  usuarioIds: number[];
}

export interface FiltroWithRelations {
  usuarioCreador?: {
    id: number;
    nombre: string;
    apellidos: string;
    email: string;
  } | null;
  usuariosAsignados?: {
    id: number;
    nombre: string;
    apellidos: string;
    email: string;
    rol: string;
  }[];
  accesos?: {
    id: number;
    nombre: string;
    apellidos: string;
    horaEntrada: Date;
    area: string;
  }[];
  identificaciones?: {
    id: number;
    tipo: string;
    numero: string;
    vigente: boolean;
  }[];
  tias?: {
    id: string;
    tipo: string;
    fechaCreacion: Date;
  }[];
  _count?: {
    usuariosAsignados: number;
    accesos: number;
    identificaciones: number;
    tias: number;
  };
}