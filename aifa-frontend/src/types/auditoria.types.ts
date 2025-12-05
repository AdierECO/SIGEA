export interface LogFiltro {
  id: number;
  fecha: string;
  usuario: string;
  accion: string;
  tipo: 'ACCESO' | 'TURNO' | 'IDENTIFICACION' | 'REPORTE' | 'FILTRO' | 'SISTEMA' | 'TIAS';
  descripcion: string;
  detalles: {
    persona?: string;
    identificacion?: string;
    tias?: string;
    tipoTIAS?: string;
    turno?: string;
    area?: string;
    filtro?: string;
    filtroId?: number;
  };
}

export interface DetalleAuditoria extends LogFiltro {
  ip?: string;
  userAgent?: string;
  recurso?: string;
  metodo?: string;
  parametros?: any;
  respuesta?: {
    codigo: number;
    mensaje: string;
    datos: any;
  };
  duracion?: number;
  detallesAdicionales?: {
    sistema?: string;
    version?: string;
    fechaConsulta?: string;
    usuarioAccion?: string;
    rolUsuario?: string;
    ubicacion?: string;
    identificacionVigente?: boolean;
    [key: string]: any;
  };
}

export interface EstadisticasFiltro {
  total: number;
  accesos: number;
  turnos: number;
  identificaciones: number;
  tias: number;
  reportes: number;
  actividadesHoy: number;
  usuariosActivos: number;
  filtrosActivos: number;
}

export interface FiltrosLogs {
  tipo?: string;
  fechaInicio: string;
  fechaFin: string;
  usuario: string;
  filtroId: string | number;
  page?: number;
  limit?: number;
}

export interface FiltroOption {
  id: number;
  nombre: string;
  ubicacion?: string;
  cantidad?: number;
}

// NUEVO: Interface para la respuesta paginada
export interface LogsFiltroResponse {
  logs: LogFiltro[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// NUEVO: Interfaces para TIAS
export interface TIASOption {
  id: string;
  tipo: string;
  filtro?: {
    id: number;
    nombre: string;
  } | null;
}

export interface TIASEstadisticas {
  totalTIAS: number;
  tiasConAccesos: number;
  tiasSinAccesos: number;
  tiasPorFiltro: Array<{
    filtroId: number;
    cantidad: number;
  }>;
  porcentajeUtilizacion: string;
}