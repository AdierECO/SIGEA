import React, { useState, useEffect, useMemo } from 'react';
import { auditoriaService } from '../../services';
import type { LogFiltro, FiltrosLogs, FiltroOption } from '../../types';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';

const LogsFiltro: React.FC = () => {
  const [logs, setLogs] = useState<LogFiltro[]>([]);
  const [filtrosActivos, setFiltrosActivos] = useState<FiltroOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFiltros, setLoadingFiltros] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [filtros, setFiltros] = useState<FiltrosLogs>({
    tipo: 'todos',
    fechaInicio: '',
    fechaFin: '',
    usuario: '',
    filtroId: 'todos',
    page: 1,
    limit: 10000 // Aumentar límite para cargar más registros
  });

  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 50;
  const [totalLogs, setTotalLogs] = useState(0);

  // Función para extraer nombre y email del campo usuario
  const extraerInfoUsuario = (usuarioString: string | undefined) => {
    if (!usuarioString) return { nombre: 'Usuario no disponible', email: '' };

    // Si el usuario viene en formato "Nombre (email)"
    const match = usuarioString.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return { nombre: match[1].trim(), email: match[2].trim() };
    }

    // Si solo viene el email
    if (usuarioString.includes('@')) {
      return { nombre: usuarioString.split('@')[0], email: usuarioString };
    }

    // Si solo viene el nombre
    return { nombre: usuarioString, email: '' };
  };

  // Filtrar logs con respaldo en frontend para el usuario
  const logsFiltrados = useMemo(() => {
    return logs.filter(log => {
      // Extraer información del usuario para filtrar
      const usuarioInfo = extraerInfoUsuario(log.usuario);

      // Filtro por tipo
      const cumpleTipo = filtros.tipo === 'todos' || !filtros.tipo
        ? (log.tipo === 'ACCESO' || log.tipo === 'FILTRO' || log.tipo === 'IDENTIFICACION')
        : log.tipo === filtros.tipo;

      // Filtro por usuario (respaldo en frontend si el backend no funciona)
      const cumpleUsuario = !filtros.usuario ||
        (usuarioInfo.nombre && usuarioInfo.nombre.toLowerCase().includes(filtros.usuario.toLowerCase())) ||
        (usuarioInfo.email && usuarioInfo.email.toLowerCase().includes(filtros.usuario.toLowerCase())) ||
        (log.usuario && log.usuario.toLowerCase().includes(filtros.usuario.toLowerCase()));

      // Filtro por fecha inicio
      const cumpleFechaInicio = !filtros.fechaInicio ||
        (() => {
          try {
            const fechaLog = new Date(log.fecha);
            const fechaInicio = new Date(filtros.fechaInicio);
            fechaInicio.setHours(0, 0, 0, 0);
            return fechaLog >= fechaInicio;
          } catch {
            return true;
          }
        })();

      // Filtro por fecha fin
      const cumpleFechaFin = !filtros.fechaFin ||
        (() => {
          try {
            const fechaLog = new Date(log.fecha);
            const fechaFin = new Date(filtros.fechaFin);
            fechaFin.setHours(23, 59, 59, 999);
            return fechaLog <= fechaFin;
          } catch {
            return true;
          }
        })();

      // Filtro por control de acceso
      const cumpleFiltroId = filtros.filtroId === 'todos' ||
        !filtros.filtroId ||
        (log.detalles.filtroId && log.detalles.filtroId.toString() === filtros.filtroId) ||
        (!log.detalles.filtroId && filtros.filtroId === 'todos');

      return cumpleTipo && cumpleUsuario && cumpleFechaInicio && cumpleFechaFin && cumpleFiltroId;
    });
  }, [logs, filtros.tipo, filtros.usuario, filtros.fechaInicio, filtros.fechaFin, filtros.filtroId]);

  // Paginación de logs filtrados
  const totalFiltrados = logsFiltrados.length;
  const totalPaginasFiltradas = Math.ceil(totalFiltrados / elementosPorPagina);
  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const logsPaginaActual = useMemo(() => {
    return logsFiltrados.slice(inicio, fin);
  }, [logsFiltrados, inicio, fin]);

  // Cargar Controles de acceso activos
  const cargarFiltrosActivos = async () => {
    try {
      setLoadingFiltros(true);
      const filtrosData = await auditoriaService.getFiltrosActivos();
      setFiltrosActivos(filtrosData);
    } catch (error: any) {
      console.error('Error cargando los Controles de acceso:', error);
    } finally {
      setLoadingFiltros(false);
    }
  };

  // Cargar logs de auditoría
  const cargarLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const filtrosParaEnviar: Partial<FiltrosLogs> = {
        page: 1,
        limit: 500
      };

      // Solo enviar filtros si no son "todos" o están vacíos
      if (filtros.tipo !== 'todos') {
        filtrosParaEnviar.tipo = filtros.tipo;
      }

      if (filtros.fechaInicio) {
        filtrosParaEnviar.fechaInicio = filtros.fechaInicio;
      }

      if (filtros.fechaFin) {
        filtrosParaEnviar.fechaFin = filtros.fechaFin;
      }

      if (filtros.filtroId !== 'todos') {
        filtrosParaEnviar.filtroId = filtros.filtroId;
      }

      const response = await auditoriaService.getLogsFiltro(filtrosParaEnviar as FiltrosLogs);

      // Procesar logs para asegurar que el campo usuario esté bien formateado
      const logsProcesados = (response.logs || []).map((log: any) => {
        // Intentar diferentes estrategias para obtener el nombre de usuario
        let usuarioDisplay = 'Usuario no disponible';

        // Estrategia 1: Si hay campos nombre y email separados
        if (log.nombre || log.email) {
          if (log.nombre && log.email) {
            usuarioDisplay = `${log.nombre} (${log.email})`;
          } else if (log.nombre) {
            usuarioDisplay = log.nombre;
          } else if (log.email) {
            usuarioDisplay = log.email;
          }
        }
        // Estrategia 2: Si hay un campo usuario
        else if (log.usuario) {
          usuarioDisplay = log.usuario;
        }
        // Estrategia 3: Si hay detalles con información de usuario
        else if (log.detalles?.usuario || log.detalles?.email) {
          if (log.detalles.usuario && log.detalles.email) {
            usuarioDisplay = `${log.detalles.usuario} (${log.detalles.email})`;
          } else if (log.detalles.usuario) {
            usuarioDisplay = log.detalles.usuario;
          } else if (log.detalles.email) {
            usuarioDisplay = log.detalles.email;
          }
        }

        return {
          ...log,
          usuario: usuarioDisplay
        };
      });

      setLogs(logsProcesados);
      setTotalLogs(response.total || 0);
      setPaginaActual(1); // Resetear a página 1 cuando carguen nuevos datos
    } catch (error: any) {
      console.error('Error cargando logs:', error);
      setError(error.response?.data?.error || 'Error al cargar los accesos e identificaciones del Control de acceso');
      setLogs([]);
      setTotalLogs(0);
    } finally {
      setLoading(false);
    }
  };

  // Efectos para cargar datos
  useEffect(() => {
    cargarFiltrosActivos();
  }, []);

  useEffect(() => {
    cargarLogs();
  }, [filtros.tipo, filtros.fechaInicio, filtros.fechaFin, filtros.filtroId]);

  const handleFiltroChange = (key: keyof FiltrosLogs, value: string) => {
    setFiltros(prev => ({ ...prev, [key]: value }));
    // Solo resetear paginación si no es búsqueda de usuario
    if (key !== 'usuario') {
      setPaginaActual(1);
    }
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      tipo: 'todos',
      fechaInicio: '',
      fechaFin: '',
      usuario: '',
      filtroId: 'todos',
      page: 1,
      limit: 500
    });
    setPaginaActual(1);
  };

  // Utilidades de UI
  const getColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'ACCESO': return 'bg-green-100 text-green-800 border border-green-200';
      case 'IDENTIFICACION': return 'bg-purple-100 text-purple-800 border border-purple-200';
      case 'FILTRO': return 'bg-blue-100 text-blue-800 border border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'ACCESO': return '🚪';
      case 'IDENTIFICACION': return '🆔';
      case 'FILTRO': return '🔧';
      default: return '📝';
    }
  };

  const formatFecha = (fechaString: string) => {
    try {
      if (typeof fechaString === 'string' && fechaString.includes(', ')) {
        const [fechaPart, horaPart] = fechaString.split(', ');
        return {
          fecha: fechaPart,
          hora: horaPart,
          completa: fechaString
        };
      }

      let fecha: Date;

      if (fechaString.includes('T')) {
        fecha = new Date(fechaString);
      } else if (/^\d+$/.test(fechaString)) {
        fecha = new Date(parseInt(fechaString));
      } else {
        fecha = new Date(fechaString);
      }

      if (isNaN(fecha.getTime())) {
        console.warn('Fecha inválida:', fechaString);
        return {
          fecha: 'Fecha inválida',
          hora: '',
          completa: fechaString
        };
      }

      const fechaFormateada = fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });

      const horaFormateada = fecha.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
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

  // Verificar si hay Controles de acceso activos
  const tieneFiltrosActivos = () => {
    return filtros.tipo !== 'todos' ||
      filtros.fechaInicio !== '' ||
      filtros.fechaFin !== '' ||
      filtros.usuario !== '' ||
      filtros.filtroId !== 'todos';
  };

  // Calcular estadísticas en tiempo real
  const calcularEstadisticasRealtime = () => {
    const accesos = logsFiltrados.filter(log => log.tipo === 'ACCESO');
    const identificaciones = logsFiltrados.filter(log => log.tipo === 'IDENTIFICACION');
    const filtrosLogs = logsFiltrados.filter(log => log.tipo === 'FILTRO');

    return {
      accesos: accesos.length,
      identificaciones: identificaciones.length,
      filtros: filtrosLogs.length,
      total: logsFiltrados.length,
      accesosActivos: (filtros.tipo === 'todos' || filtros.tipo === 'ACCESO')
        ? accesos.filter(a => {
          return a.accion.includes('entrada') || a.accion.includes('Entrada') ||
            !a.descripcion?.includes('salida');
        }).length
        : 0,
      identificacionesVigentes: (filtros.tipo === 'todos' || filtros.tipo === 'IDENTIFICACION')
        ? identificaciones.filter(i =>
          i.descripcion?.includes('vigente') || !i.descripcion?.includes('entregada')
        ).length
        : 0
    };
  };

  const statsRealtime = calcularEstadisticasRealtime();

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando accesos e identificaciones...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📋 Accesos e Identificaciones por Control de acceso</h1>
              <p className="text-gray-600">
                {filtros.tipo === 'todos'
                  ? 'Registros de personas e identificaciones que pasaron por los filtros de seguridad'
                  : `Registros de ${filtros.tipo?.toLowerCase()} en los filtros de seguridad`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Mostrar Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-500 text-lg">⚠️</div>
              <div className="ml-3">
                <div className="text-red-800 font-medium">Error</div>
                <div className="text-red-600 text-sm">{error}</div>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Estadísticas Específicas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
            <div className="text-2xl font-bold text-blue-600">{statsRealtime.total}</div>
            <div className="text-sm text-gray-600">Total Registros</div>
          </div>

          {(filtros.tipo === 'todos' || filtros.tipo === 'ACCESO') && (
            <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-green-600">{statsRealtime.accesos}</div>
              <div className="text-sm text-gray-600">Accesos</div>
            </div>
          )}

          {(filtros.tipo === 'todos' || filtros.tipo === 'IDENTIFICACION') && (
            <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-purple-600">{statsRealtime.identificaciones}</div>
              <div className="text-sm text-gray-600">Identificaciones</div>
            </div>
          )}

          {(filtros.tipo === 'todos' || filtros.tipo === 'FILTRO') && (
            <div className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-blue-600">{statsRealtime.filtros}</div>
              <div className="text-sm text-gray-600">Controles de acceso</div>
            </div>
          )}
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
                <option value="IDENTIFICACION">Identificaciones</option>
                <option value="FILTRO">Control de acceso</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtro</label>
              <select
                value={filtros.filtroId}
                onChange={(e) => handleFiltroChange('filtroId', e.target.value)}
                disabled={loadingFiltros}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="todos">Control de acceso</option>
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

          {/* Búsqueda de Usuario */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar por Usuario/Email</label>
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={filtros.usuario}
              onChange={(e) => handleFiltroChange('usuario', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {logsPaginaActual.length} de {totalFiltrados} actividades filtradas
              {totalLogs > totalFiltrados && ` (de ${totalLogs} totales)`}
              {filtros.tipo !== 'todos' && ` • Filtrado por: ${filtros.tipo}`}
              {filtros.usuario && ` • Usuario: ${filtros.usuario}`}
              {totalPaginasFiltradas > 0 && ` (Página ${paginaActual} de ${totalPaginasFiltradas})`}
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
                    Control de acceso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logsPaginaActual.map((log) => {
                  const { fecha, hora } = formatFecha(log.fecha.toString());
                  // Extraer nombre y email para mostrarlos separados
                  const usuarioInfo = extraerInfoUsuario(log.usuario);

                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{fecha}</div>
                        <div className="text-sm text-gray-500">{hora}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 truncate" title={usuarioInfo.nombre}>
                          {usuarioInfo.nombre}
                        </div>
                        {usuarioInfo.email && (
                          <div className="text-xs text-gray-500 truncate" title={usuarioInfo.email}>
                            {usuarioInfo.email}
                          </div>
                        )}
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

          {logsPaginaActual.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {tieneFiltrosActivos() ? 'No se encontraron resultados' : 'No hay registros de accesos o identificaciones'}
              </h3>
              <p className="text-gray-600 mb-4">
                {tieneFiltrosActivos()
                  ? 'Intenta ajustar los filtros para ver más resultados.'
                  : 'Los registros de accesos e identificaciones aparecerán aquí cuando se realicen actividades en el sistema.'
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
        {totalPaginasFiltradas > 1 && (
          <div className="bg-white px-6 py-4 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-700">
                Página {paginaActual} de {totalPaginasFiltradas} • {totalFiltrados} registros filtrados
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
                  {Array.from({ length: Math.min(5, totalPaginasFiltradas) }, (_, i) => {
                    const pagina = paginaActual <= 3 ? i + 1 :
                      paginaActual >= totalPaginasFiltradas - 2 ? totalPaginasFiltradas - 4 + i :
                        paginaActual - 2 + i;
                    if (pagina < 1 || pagina > totalPaginasFiltradas) return null;

                    return (
                      <button
                        key={pagina}
                        onClick={() => setPaginaActual(pagina)}
                        className={`px-3 py-2 border rounded-lg text-sm min-w-10 transition-colors ${pagina === paginaActual
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
                  onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginasFiltradas))}
                  disabled={paginaActual === totalPaginasFiltradas}
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

export default LogsFiltro;