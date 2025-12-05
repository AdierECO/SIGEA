export type Rol = 'SUPERADMIN' | 'ADMINISTRADOR' | 'SUPERVISOR' | 'OPERATIVO';

export interface Usuario {
  id: number;
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  telefono?: string | null;
  rol: Rol;
  estaActivo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  filtroAsignadoId?: number | null;
  filtroAsignado?: {
    id: number;
    nombre: string;
    descripcion?: string | null;
    ubicacion?: string | null;
    estaActivo: boolean;
  } | null;
}

export interface CreateUsuarioDto {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  telefono?: string | null;
  rol?: Rol;
  filtroAsignadoId?: number | null;
}

export interface UpdateUsuarioDto {
  email?: string;
  password?: string;
  nombre?: string;
  apellidos?: string;
  telefono?: string | null;
  rol?: Rol;
  estaActivo?: boolean;
  filtroAsignadoId?: number | null;
}