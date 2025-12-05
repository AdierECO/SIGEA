import type { Acceso } from "./index";

export interface Identificacion {
  id: number;
  tipo: string;
  numero?: string | null;
  vigente: boolean;
  accesos?: Acceso[];
}

export interface CreateIdentificacionDto {
  tipo: string;
  numero?: string | null;
  vigente?: boolean;
}

export interface UpdateIdentificacionDto {
  tipo?: string;
  numero?: string | null;
  vigente?: boolean;
}