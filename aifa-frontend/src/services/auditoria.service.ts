// services/auditoria.service.ts
import { api } from './api';
import type { 
  DetalleAuditoria,
  EstadisticasFiltro, 
  FiltrosLogs, 
  FiltroOption,
  LogsFiltroResponse
} from '../types';

export const auditoriaService = {
  async getLogsFiltro(filtros: FiltrosLogs): Promise<LogsFiltroResponse> {
    const params = new URLSearchParams();
  
    if (filtros.tipo && filtros.tipo !== 'todos') {
      params.append('tipo', filtros.tipo);
    }
    if (filtros.fechaInicio) {
      params.append('fechaInicio', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      params.append('fechaFin', filtros.fechaFin);
    }
    if (filtros.usuario) {
      params.append('usuario', filtros.usuario);
    }
    if (filtros.filtroId && filtros.filtroId !== 'todos') {
      params.append('filtroId', filtros.filtroId.toString());
    }
    if (filtros.page) {
      params.append('page', filtros.page.toString());
    }
    if (filtros.limit) {
      params.append('limit', filtros.limit.toString());
    }

    const response = await api.get(`/auditoria/filtro?${params}`);
    return response.data;
  },

  async getDetalleAuditoria(id: string): Promise<DetalleAuditoria> {
    const response = await api.get(`/auditoria/${id}`);
    return response.data;
  },

  async getEstadisticasFiltro(filtroId?: string): Promise<EstadisticasFiltro> {
    const params = new URLSearchParams();
    if (filtroId && filtroId !== 'todos') {
      params.append('filtroId', filtroId);
    }
    
    const response = await api.get(`/auditoria/filtro/estadisticas?${params}`);
    return response.data;
  },

  async getFiltrosActivos(): Promise<FiltroOption[]> {
    const response = await api.get('/filtros/activos');
    return response.data;
  },
};