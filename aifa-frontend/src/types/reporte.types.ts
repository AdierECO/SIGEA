import type { Acceso } from "./acceso.types";
import type { Turno } from "./turno.types";
import type { Usuario } from "./usuario.types";

export interface ReporteGlobalResponse {
  success: boolean;
  datos: {
    accesos: Acceso[];
    turnos: Turno[];
    usuarios: Usuario[];
  };
  estadisticas: {
    totalAccesos: number;
    accesosActivos: number;
    identificacionesRetenidas: number;
    conAcompanante: number;
    accesosConFiltro: number;
    totalTurnos: number;
    turnosActivos: number;
    usuariosActivos: number;
    totalFiltros: number;
    promedioDiario: number;
    tasaCompletitud: number;
    tasaIdentificacion: number;
    tasaAcompanante: number;
    diasPeriodo: number;
    fechaInicio: Date;
    fechaFin: Date;
  };
  agrupaciones: {
    porArea: Record<string, number>;
    porMotivo: Record<string, number>;
    porFiltro: Record<string, number>;
    porTurno: Record<string, number>;
    porCreador: Record<string, number>;
    porDia: Record<string, number>;
  };
  metadata: {
    fechaGeneracion: Date;
    periodo: string;
    totalRegistros: number;
  };
}

export interface FiltrosReporte {
  fechaInicio: string;
  fechaFin: string;
  filtroId?: number;
  usuarioId?: number;
  turnoId?: number;
  area?: string;
  tipoReporte: 'global' | 'diario' | 'filtro' | 'personalizado';
}

export interface ConfiguracionReporte {
  vistaActiva: VistaReporte;
  filtros: FiltrosReporte;
}

export interface EstadisticasLocales {
  totalAccesos: number;
  accesosActivos: number;
  identificacionesRetenidas: number;
  conAcompanante: number;
  totalTurnos: number;
  turnosActivos: number;
  usuariosActivos: number;
  accesosConFiltro: number;
}

export interface ReportePorDia {
  fecha: string;
  total: number;
  activos: number;
  retenidas: number;
  acompanantes: number;
  areas: Record<string, number>;
  areaMasVisitada: string;
  porcentajeActivos: number;
  fechaObj: Date;
}

export interface PersonaReporte {
  identificacion: string;
  nombre: string;
  apellidos: string;
  empresa: string | null;
  totalVisitas: number;
  primeraVisita: Date;
  ultimaVisita: Date;
  areasVisitadas: string;
  identificacionesRetenidas: number;
  areasSet: Set<string>;
}

export type VistaReporte = 'global' | 'fechas' | 'personas';