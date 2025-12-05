import { Acceso, Filtro } from "@prisma/client";
export interface TIAS {
    id: string;
    tipo: string;
    estado: boolean;
    filtroId?: number | null;
    fechaCreacion: Date;
    fechaActualizacion: Date;
    filtro?: Filtro | null;
    accesos?: Acceso[];
}
export interface CreateTIASDto {
    id: string;
    tipo: string;
    estado?: boolean;
    filtroId?: number | null;
}
export interface CreateTIASRangoDto {
    inicio: number;
    fin: number;
    tipo: string;
    estado?: boolean;
    filtroId?: number | null;
    prefijo?: string;
}
export interface UpdateTIASDto {
    tipo?: string;
    estado?: boolean;
    filtroId?: number | null;
}
export interface TIASWithRelations {
    id: string;
    tipo: string;
    estado: boolean;
    filtroId?: number | null;
    fechaCreacion: Date;
    fechaActualizacion: Date;
    filtro?: {
        id: number;
        nombre: string;
        ubicacion: string;
    } | null;
    accesos?: {
        id: number;
        nombre: string;
        apellidos: string;
        horaEntrada: Date;
        area: string;
    }[];
    _count?: {
        accesos: number;
    };
}
//# sourceMappingURL=tias.types.d.ts.map