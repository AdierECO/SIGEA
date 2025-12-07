export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Types para formularios del frontend
export interface AccesoFormData {
  // Datos personales
  nombre: string;
  apellidos: string;
  telefono?: string;
  identificacionPersona: string;
  empresa?: string;
  motivo: string;
  area: string;
  
  // Escolta
  tieneAcompanante: boolean;
  nombreAcompanante?: string;
  apellidosAcompanante?: string;
  telefonoAcompanante?: string;
  identificacionAcompanante?: string;
  
  // Identificación retenida
  identificacionRetenida: boolean;
  numeroIdentificacion?: string;
  
  // Evidencias
  evidencias: File[];
}

export interface TurnoFormData {
  nombre: string;
  apellidos: string;
  telefono?: string;
  horaInicio: string;
}