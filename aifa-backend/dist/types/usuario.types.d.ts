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
//# sourceMappingURL=usuario.types.d.ts.map