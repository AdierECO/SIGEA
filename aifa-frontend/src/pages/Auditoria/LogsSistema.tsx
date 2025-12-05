import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auditoriaService } from '../../services/auditoria.service';
import type { LogFiltro, FiltrosLogs, FiltroOption, EstadisticasFiltro } from '../../types';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const LogsSistema: React.FC = () => {
  const { usuario } = useAuth();
  const [logs, setLogs] = useState<LogFiltro[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLoadingEstadisticas] = useState(true);
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState<FiltrosLogs>({
    tipo: 'todos',
    fechaInicio: '',
    fechaFin: '',
    usuario: '',
    filtroId: 'todos'
  });
  const [filtrosActivos, setFiltrosActivos] = useState<FiltroOption[]>([]);
  const [, setEstadisticas] = useState<EstadisticasFiltro>({
    total: 0,
    accesos: 0,
    turnos: 0,
    identificaciones: 0,
    tias:0,
    reportes: 0,
    actividadesHoy: 0,
    usuariosActivos: 0,
    filtrosActivos: 0
  });
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 50;
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  // Cargar filtros activos
  useEffect(() => {
    const cargarFiltrosActivos = async () => {
      try {
        const filtros = await auditoriaService.getFiltrosActivos();
        setFiltrosActivos(filtros);
      } catch (error) {
        console.error('Error cargando filtros:', error);
      }
    };
    cargarFiltrosActivos();
  }, []);

  // Cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      setLoadingEstadisticas(true);
      const stats = await auditoriaService.getEstadisticasFiltro();
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  // Cargar logs y estadísticas
  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        // Cargar logs y estadísticas en paralelo
        const [logsResponse] = await Promise.all([
          auditoriaService.getLogsFiltro({
            ...filtros,
            page: paginaActual,
            limit: elementosPorPagina
          }),
          cargarEstadisticas() // Cargar estadísticas también
        ]);

        setLogs(logsResponse.logs);
        setTotalLogs(logsResponse.total);
        setTotalPaginas(logsResponse.totalPages);

      } catch (error) {
        console.error('Error cargando logs:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [filtros, paginaActual]);

  // También cargar estadísticas cuando cambien los filtros principales
  useEffect(() => {
    cargarEstadisticas();
  }, [filtros.tipo, filtros.filtroId]);

  const handleFiltroChange = (key: keyof FiltrosLogs, value: string) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
    setPaginaActual(1); // Resetear a primera página al cambiar filtros
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      tipo: 'todos',
      fechaInicio: '',
      fechaFin: '',
      usuario: '',
      filtroId: 'todos'
    });
    setPaginaActual(1);
  };

  const getColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'ACCESO': return 'bg-green-100 text-green-800 border border-green-200';
      case 'TURNO': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'IDENTIFICACION': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'REPORTE': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'FILTRO': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'SISTEMA': return 'bg-red-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'ACCESO': return '🚪';
      case 'TURNO': return '⏰';
      case 'IDENTIFICACION': return '🆔';
      case 'REPORTE': return '📊';
      case 'FILTRO': return '🔍';
      case 'SISTEMA': return '⚙️';
      default: return '📝';
    }
  };

  const formatFecha = (fechaString: string) => {
    try {
      // Si la fecha ya está en formato legible, la retornamos directamente
      if (typeof fechaString === 'string' && fechaString.includes(', ')) {
        const [fechaPart, horaPart] = fechaString.split(', ');
        return {
          fecha: fechaPart,
          hora: horaPart,
          completa: fechaString
        };
      }

      // Si es un timestamp de PostgreSQL o formato ISO
      let fecha: Date;
      
      // Intentar parsear como fecha ISO
      if (fechaString.includes('T')) {
        fecha = new Date(fechaString);
      } 
      // Si es un timestamp numérico
      else if (/^\d+$/.test(fechaString)) {
        fecha = new Date(parseInt(fechaString));
      }
      // Intentar con otros formatos
      else {
        fecha = new Date(fechaString);
      }

      // Validar que la fecha sea válida
      if (isNaN(fecha.getTime())) {
        console.warn('Fecha inválida:', fechaString);
        return {
          fecha: 'Fecha inválida',
          hora: '',
          completa: fechaString
        };
      }

      // Formatear fecha en español
      const fechaFormateada = fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      const horaFormateada = fecha.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Para formato 24 horas
      });

      return {
        fecha: fechaFormateada,
        hora: horaFormateada,
        completa: `${fechaFormateada} ${horaFormateada}`
      };
    } catch (error) {
      console.error('Error formateando fecha:', error, 'Fecha original:', fechaString);
      return {
        fecha: 'Error',
        hora: '',
        completa: fechaString
      };
    }
  };

  // Verificar si hay filtros activos
  const tieneFiltrosActivos = () => {
    return filtros.tipo !== 'todos' || 
           filtros.fechaInicio !== '' || 
           filtros.fechaFin !== '' || 
           filtros.usuario !== '' || 
           filtros.filtroId !== 'todos';
  };

  // Calcular estadísticas en tiempo real basadas en los logs actuales
  const estadisticasRealtime = {
    total: totalLogs,
    accesos: logs.filter(log => log.tipo === 'ACCESO').length,
    turnos: logs.filter(log => log.tipo === 'TURNO').length,
    identificaciones: logs.filter(log => log.tipo === 'IDENTIFICACION').length,
    reportes: logs.filter(log => log.tipo === 'REPORTE').length,
    actividadesHoy: logs.filter(log => {
      const hoy = new Date().toDateString();
      const fechaLog = new Date(log.fecha);
      return fechaLog.toDateString() === hoy;
    }).length
  };

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando logs del sistema...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Navbar/>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Auditoría del Sistema</h1>
              <p className="text-gray-600">Registro completo de actividades y eventos del sistema</p>
            </div>
            <div className="text-sm text-gray-600 text-right">
              <div>Usuario: {usuario?.nombre} {usuario?.apellidos}</div>
              <div className="text-xs text-gray-500">Rol: {usuario?.rol}</div>
            </div>
          </div>
        </div>

        {/* Estadísticas - SOLO 4 COMO ORIGINAL */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-blue-600">{estadisticasRealtime.total.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Actividades</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-green-600">{estadisticasRealtime.accesos.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Accesos</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-purple-600">{estadisticasRealtime.identificaciones.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Identificaciones</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-orange-600">{estadisticasRealtime.actividadesHoy.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Actividades Hoy</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
              <select
                value={filtros.tipo}
                onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los tipos</option>
                <option value="ACCESO">Accesos</option>
                <option value="TURNO">Turnos</option>
                <option value="IDENTIFICACION">Identificaciones</option>
                <option value="REPORTE">Reportes</option>
                <option value="FILTRO">Filtros</option>
                <option value="SISTEMA">Sistema</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtro</label>
              <select
                value={filtros.filtroId}
                onChange={(e) => handleFiltroChange('filtroId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los filtros</option>
                {filtrosActivos.map(filtro => (
                  <option key={filtro.id} value={filtro.id.toString()}>
                    {filtro.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {logs.length} de {totalLogs} actividades
              {totalPaginas > 0 && ` (Página ${paginaActual} de ${totalPaginas})`}
              {tieneFiltrosActivos() && (
                <span className="ml-2 text-blue-600 font-medium">• Filtros activos</span>
              )}
            </div>
            <div className="flex space-x-2">
              {tieneFiltrosActivos() && (
                <button
                  onClick={handleLimpiarFiltros}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 flex items-center transition-colors"
                >
                  🗑️ Limpiar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Resto del componente se mantiene igual */}
        {/* Tabla de Logs */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Filtro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => {
                  const { fecha, hora } = formatFecha(log.fecha.toString());
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{fecha}</div>
                        <div className="text-sm text-gray-500">{hora}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 truncate" title={log.usuario}>
                          {log.usuario}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getColorTipo(log.tipo)}`}>
                          {getIconoTipo(log.tipo)} {log.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{log.accion}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className="text-sm text-gray-700 max-w-md line-clamp-2 hover:line-clamp-none cursor-help"
                          title={log.descripcion}
                        >
                          {log.descripcion}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.detalles.filtro ? (
                          <div className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded text-center">
                            {log.detalles.filtro}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/detalle/${log.id}`)}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1 hover:underline transition-colors"
                        >
                          <span>👁️</span>
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {tieneFiltrosActivos() ? 'No se encontraron resultados' : 'No hay registros de auditoría'}
              </h3>
              <p className="text-gray-600 mb-4">
                {tieneFiltrosActivos() 
                  ? 'Intenta ajustar los filtros para ver más resultados.' 
                  : 'Los registros de auditoría aparecerán aquí cuando se realicen actividades en el sistema.'
                }
              </p>
              {tieneFiltrosActivos() && (
                <button
                  onClick={handleLimpiarFiltros}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="bg-white px-6 py-4 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-700">
                Página {paginaActual} de {totalPaginas} • {totalLogs} registros totales
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                  disabled={paginaActual === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors flex items-center"
                >
                  ← Anterior
                </button>
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    const pagina = paginaActual <= 3 ? i + 1 :
                      paginaActual >= totalPaginas - 2 ? totalPaginas - 4 + i :
                        paginaActual - 2 + i;
                    if (pagina < 1 || pagina > totalPaginas) return null;

                    return (
                      <button
                        key={pagina}
                        onClick={() => setPaginaActual(pagina)}
                        className={`px-3 py-2 border rounded-lg text-sm min-w-10 transition-colors ${
                          pagina === paginaActual
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pagina}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                  disabled={paginaActual === totalPaginas}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors flex items-center"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogsSistema;