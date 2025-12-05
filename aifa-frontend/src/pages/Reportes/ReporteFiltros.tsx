import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Acceso, Filtro } from '../../types';
import Navbar from '../../components/Navbar';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';

interface EstadisticasFiltro {
  totalAccesos: number;
  accesosActivos: number;
  identificacionesRetenidas: number;
  conAcompanante: number;
  accesosConFiltro: number;
  promedioDiario: number;
  primeraFecha: Date | null;
  ultimaFecha: Date | null;
}

const ReporteFiltros: React.FC = () => {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [filtroSeleccionado, setFiltroSeleccionado] = useState<string>('');
  const [filtros, setFiltros] = useState<Filtro[]>([]);
  const [datos, setDatos] = useState<Acceso[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasFiltro>({
    totalAccesos: 0,
    accesosActivos: 0,
    identificacionesRetenidas: 0,
    conAcompanante: 0,
    accesosConFiltro: 0,
    promedioDiario: 0,
    primeraFecha: null,
    ultimaFecha: null
  });

  // Determinar si el usuario es SUPERVISOR
  const esSupervisor = usuario?.rol === 'SUPERVISOR';

  useEffect(() => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);

    setFechaInicio(inicio.toISOString().split('T')[0]);
    setFechaFin(fin.toISOString().split('T')[0]);

    cargarFiltros();
  }, []);

  const cargarFiltros = async () => {
    try {
      // Intentar diferentes endpoints
      let response;
      let filtrosData: Filtro[] = [];

      try {
        // PRIMERO: Intentar con endpoint de filtros activos
        response = await api.get('/filtros/activos');
        filtrosData = response.data.filtros || response.data || [];
      } catch (error) {

        // SEGUNDO: Intentar con endpoint general
        response = await api.get('/filtros');
        filtrosData = response.data.filtros || response.data || [];
      }

      // Asegurarnos de que todos los filtros tengan el campo estaActivo
      const filtrosConEstado = filtrosData.map((filtro: Filtro) => ({
        ...filtro,
        // Si no viene el campo estaActivo, asumimos que está activo (true)
        estaActivo: filtro.estaActivo !== undefined ? filtro.estaActivo : true
      }));

      setFiltros(filtrosConEstado);

    } catch (error) {
      console.error('❌ Error cargando filtros:', error);
      setFiltros([]);
    }
  };

  const fetchDatosPorFiltro = async (inicio: Date, fin: Date, filtroId: string) => {
    try {
      setLoading(true);

      // PRIMERO intentar con endpoint específico de filtro
      try {
        const response = await api.get(`/reportes/filtro/${filtroId}`, {
          params: {
            fechaInicio: inicio.toISOString(),
            fechaFin: fin.toISOString()
          }
        });

        if (response.data.success) {
          const accesosFiltrados = response.data.datos?.accesos || [];
          setDatos(accesosFiltrados);
          calcularEstadisticas(accesosFiltrados, inicio, fin);
          return;
        }
      } catch (error) {
        console.log('❌ Endpoint específico de filtro falló, intentando método alternativo...');
      }

      // SEGUNDO intentar con filtro en endpoint global
      try {
        const response = await api.get('/reportes/global', {
          params: {
            fechaInicio: inicio.toISOString(),
            fechaFin: fin.toISOString(),
            filtroId: filtroId,
            incluirEstadisticas: 'true'
          }
        });

        if (response.data.success) {
          const accesosFiltrados = response.data.datos?.accesos || [];
          setDatos(accesosFiltrados);
          calcularEstadisticas(accesosFiltrados, inicio, fin);
          return;
        }
      } catch (error) {
      }

      // TERCERO fallback: obtener todos y filtrar localmente
      await fetchDatosFallback(inicio, fin, filtroId);

    } catch (error) {
      console.error('❌ Error en fetchDatosPorFiltro:', error);
      await fetchDatosFallback(inicio, fin, filtroId);
    } finally {
      setLoading(false);
    }
  };

  const fetchDatosTodosFiltros = async (inicio: Date, fin: Date) => {
    try {
      setLoading(true);

      const response = await api.get('/reportes/global', {
        params: {
          fechaInicio: inicio.toISOString(),
          fechaFin: fin.toISOString(),
          incluirEstadisticas: 'true'
        }
      });

      if (response.data.success) {
        const accesosFiltrados = response.data.datos?.accesos || [];
        setDatos(accesosFiltrados);
        calcularEstadisticas(accesosFiltrados, inicio, fin);
      }
    } catch (error) {
      console.error('❌ Error en fetchDatosTodosFiltros:', error);
      await fetchDatosFallback(inicio, fin);
    } finally {
      setLoading(false);
    }
  };

  const fetchDatosFallback = async (inicio: Date, fin: Date, filtroId?: string) => {
    try {
      let response;
      try {
        response = await api.get('/accesos');
      } catch (error) {
        console.error('❌ No se pudieron obtener los accesos');
        setDatos([]);
        calcularEstadisticas([], inicio, fin);
        return;
      }

      const todosAccesos = response.data.accesos || response.data || [];
      // Filtrar por fechas
      const accesosFiltradosPorFecha = todosAccesos.filter((acceso: Acceso) => {
        if (!acceso.horaEntrada) return false;
        const fechaAcceso = new Date(acceso.horaEntrada);
        return fechaAcceso >= inicio && fechaAcceso <= fin;
      });


      // Filtrar por filtro si está seleccionado
      let accesosFinales = accesosFiltradosPorFecha;
      if (filtroId && filtroId !== '') {
        accesosFinales = accesosFiltradosPorFecha.filter((acceso: Acceso) =>
          acceso.filtroId === parseInt(filtroId)
        );
      }

      setDatos(accesosFinales);
      calcularEstadisticas(accesosFinales, inicio, fin);

    } catch (error) {
      console.error('❌ Error en fallback:', error);
      setDatos([]);
      calcularEstadisticas([], inicio, fin);
    }
  };

  const calcularEstadisticas = (accesos: Acceso[], inicio: Date, fin: Date) => {
    const totalAccesos = accesos.length;
    const accesosActivos = accesos.filter(a => !a.horaSalida).length;
    const identificacionesRetenidas = accesos.filter(a => a.identificacionId).length;
    const conAcompanante = accesos.filter(a => a.tieneAcompanante).length;
    const accesosConFiltro = accesos.filter(a => a.filtroId).length;

    const fechasAccesos = accesos.map(a => new Date(a.horaEntrada));
    const primeraFecha = fechasAccesos.length > 0 ? new Date(Math.min(...fechasAccesos.map(d => d.getTime()))) : null;
    const ultimaFecha = fechasAccesos.length > 0 ? new Date(Math.max(...fechasAccesos.map(d => d.getTime()))) : null;

    const diasPeriodo = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const promedioDiario = diasPeriodo > 0 ? Math.round(totalAccesos / diasPeriodo) : 0;

    setEstadisticas({
      totalAccesos,
      accesosActivos,
      identificacionesRetenidas,
      conAcompanante,
      accesosConFiltro,
      promedioDiario,
      primeraFecha,
      ultimaFecha
    });

  };

  const handleFiltrar = () => {
    if (!fechaInicio || !fechaFin) {
      alert('Por favor seleccione ambas fechas');
      return;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);

    if (inicio > fin) {
      alert('La fecha de inicio no puede ser mayor a la fecha fin');
      return;
    }

    if (filtroSeleccionado && filtroSeleccionado !== '') {
      fetchDatosPorFiltro(inicio, fin, filtroSeleccionado);
    } else {
      fetchDatosTodosFiltros(inicio, fin);
    }
  };

  const handleExportar = async (formato: 'pdf' | 'excel' | 'csv') => {
    try {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);

      const exportData: any = {
        formato,
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
        tipoReporte: 'por-filtro'
      };

      // AGREGAR FILTRO ID PARA QUE EL BACKEND SEPA QUE ES POR FILTRO
      if (filtroSeleccionado && filtroSeleccionado !== '') {
        exportData.filtroId = filtroSeleccionado;
        exportData.tipoReporte = 'filtro-especifico';
      }

      const response = await api.post('/reportes/exportar', exportData, {
        responseType: 'blob',
        timeout: 30000
      });

      const blob = new Blob([response.data], {
        type: response.headers['content-type']
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];

      // Nombre del archivo según el filtro seleccionado
      let nombreFiltro = 'todos-los-filtros';
      if (filtroSeleccionado) {
        const filtro = filtros.find(f => f.id === parseInt(filtroSeleccionado));
        nombreFiltro = filtro ?
          filtro.nombre.toLowerCase().replace(/\s+/g, '-') :
          'filtro-especifico';
      }

      let fileName = `reporte-${nombreFiltro}-${fechaInicio}-a-${fechaFin}.${formato === 'excel' ? 'xlsx' : formato}`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) fileName = fileNameMatch[1];
      }

      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        text: `Reporte exportado en formato ${formato.toUpperCase()}`,
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });
    } catch (error) {
      console.error(`Error exportando reporte ${formato}:`, error);
      alert(`Error al exportar el reporte en formato ${formato.toUpperCase()}`);
    }
  };

  const accesosPorArea = datos.reduce((acc: Record<string, number>, acceso) => {
    const area = acceso.area || 'Sin área especificada';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});

  const accesosPorMotivo = datos.reduce((acc: Record<string, number>, acceso) => {
    const motivo = acceso.motivo || 'Sin motivo especificado';
    const motivoCorto = motivo.length > 25 ? motivo.substring(0, 25) + '...' : motivo;
    acc[motivoCorto] = (acc[motivoCorto] || 0) + 1;
    return acc;
  }, {});

  const filtroActual = filtros.find(f => f.id === parseInt(filtroSeleccionado));

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🚪 Reporte por Filtros</h1>
              <p className="text-gray-600">Análisis detallado por filtro de acceso</p>

              {/* Navegación */}
              <div className="mt-4 flex flex-wrap gap-2">
                {/* Solo mostrar el botón de Vista Global si NO es supervisor */}
                {!esSupervisor && (
                  <Link
                    to="/reportes"
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
                  >
                    📊 Vista Global
                  </Link>
                )}
                <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white">
                  🚪 Vista por Filtros
                </button>
                <Link
                  to="/reportes/personas"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
                >
                  👥 Vista por Personas
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Filtros de Búsqueda</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtro</label>
              <select
                value={filtroSeleccionado}
                onChange={(e) => setFiltroSeleccionado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los filtros</option>
                {filtros.map((filtro) => (
                  <option key={filtro.id} value={filtro.id}>
                    {filtro.nombre} {filtro.ubicacion ? `- ${filtro.ubicacion}` : ''}
                    {/* SOLO mostrar (INACTIVO) si el filtro explícitamente tiene estaActivo: false */}
                    {filtro.estaActivo === false && ' (INACTIVO)'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={handleFiltrar}
              disabled={loading}
              className={`w-full px-4 py-2 rounded-lg flex items-center justify-center ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Cargando...
                </>
              ) : (
                '🔍 Generar Reporte'
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Generando reporte...</div>
            <div className="text-sm text-gray-500 mt-2">Esto puede tomar unos segundos</div>
          </div>
        )}

        {/* Información del Filtro Seleccionado */}
        {!loading && filtroActual && (
          <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Información del Filtro</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-blue-700">Nombre:</span>
                <p className="text-lg font-semibold text-blue-900">{filtroActual.nombre}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-700">Ubicación:</span>
                <p className="text-lg font-semibold text-blue-900">{filtroActual.ubicacion || 'No especificada'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-blue-700">Estado:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  // Si estaActivo es undefined o true, mostrar como Activo
                  filtroActual.estaActivo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {/*Mostrar "Activo" si estaActivo no es explícitamente false */}
                  {filtroActual.estaActivo !== false ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mostrar información cuando no hay filtro seleccionado */}
        {!loading && !filtroSeleccionado && (
          <div className="bg-yellow-50 rounded-lg p-6 mb-6 border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">ℹ️ Reporte de Todos los Filtros</h3>
            <p className="text-yellow-700">
              Mostrando estadísticas combinadas de todos los filtros activos en el sistema.
              Seleccione un filtro específico para ver análisis detallados.
            </p>
          </div>
        )}

        {/* Contenido cuando no está cargando */}
        {!loading && (
          <>
            {/* Estadísticas del Filtro */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-2xl font-bold text-blue-600">{estadisticas.totalAccesos}</div>
                <div className="text-sm text-gray-600">Total Accesos</div>
                <div className="text-xs text-gray-500 mt-1">
                  {estadisticas.promedioDiario}/día
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-2xl font-bold text-green-600">{estadisticas.accesosActivos}</div>
                <div className="text-sm text-gray-600">Accesos Activos</div>
                <div className="text-xs text-red-600 mt-1">
                  {estadisticas.totalAccesos > 0 ?
                    `${((estadisticas.accesosActivos / estadisticas.totalAccesos) * 100).toFixed(1)}% pendientes`
                    : '0% pendientes'}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-2xl font-bold text-orange-600">{estadisticas.identificacionesRetenidas}</div>
                <div className="text-sm text-gray-600">ID Retenidas</div>
                <div className="text-xs text-orange-600 mt-1">
                  {estadisticas.totalAccesos > 0 ?
                    `${((estadisticas.identificacionesRetenidas / estadisticas.totalAccesos) * 100).toFixed(1)}% del total`
                    : '0% del total'}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <div className="text-2xl font-bold text-purple-600">{estadisticas.conAcompanante}</div>
                <div className="text-sm text-gray-600">Con Acompañante</div>
                <div className="text-xs text-blue-600 mt-1">
                  {estadisticas.totalAccesos > 0 ?
                    `${((estadisticas.conAcompanante / estadisticas.totalAccesos) * 100).toFixed(1)}% de visitas`
                    : '0% de visitas'}
                </div>
              </div>
            </div>

            {/* Información Temporal */}
            {estadisticas.primeraFecha && estadisticas.ultimaFecha && (
              <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🕐 Período de Actividad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Primer acceso registrado:</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {estadisticas.primeraFecha.toLocaleDateString()} a las {estadisticas.primeraFecha.toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Último acceso registrado:</span>
                    <p className="text-lg font-semibold text-gray-900">
                      {estadisticas.ultimaFecha.toLocaleDateString()} a las {estadisticas.ultimaFecha.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Grid de Análisis */}
            {datos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Accesos por Área */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Accesos por Área</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {Object.entries(accesosPorArea)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([area, count]) => (
                          <div key={area} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 flex-1 truncate" title={area}>{area}</span>
                            <div className="flex items-center w-32">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{
                                    width: `${estadisticas.totalAccesos > 0 ? (Number(count) / estadisticas.totalAccesos) * 100 : 0}%`
                                  }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold w-8 text-right">{count}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Accesos por Motivo */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Accesos por Motivo</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {Object.entries(accesosPorMotivo)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 10)
                        .map(([motivo, count]) => (
                          <div key={motivo} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700 flex-1 truncate" title={motivo}>{motivo}</span>
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold min-w-8 text-center">
                              {count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Tabla de Accesos Recientes */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden mt-6">
                  <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">📋 Últimos Accesos Registrados</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      Mostrando los últimos {Math.min(datos.length, 20)} de {datos.length} accesos
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Persona
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Área
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Motivo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hora Entrada
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {datos.slice(0, 20).map((acceso, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-semibold">{acceso.nombre} {acceso.apellidos}</div>
                                <div className="text-sm text-gray-500">{acceso.empresa || 'Sin empresa'}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900">{acceso.area}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm" title={acceso.motivo}>
                                {acceso.motivo.length > 50 ?
                                  acceso.motivo.substring(0, 50) + '...' :
                                  acceso.motivo
                                }
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">
                                {new Date(acceso.horaEntrada).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(acceso.horaEntrada).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {acceso.horaSalida ? (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                                  Completado
                                </span>
                              ) : (
                                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                                  Activo
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              /* Mensaje cuando no hay datos */
              !loading && (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                  <div className="text-gray-500 text-lg mb-2">📭 No hay datos para mostrar</div>
                  <p className="text-gray-400">
                    {filtroSeleccionado
                      ? `No se encontraron accesos para el filtro seleccionado en el período ${fechaInicio} a ${fechaFin}`
                      : `No se encontraron accesos en el período ${fechaInicio} a ${fechaFin}`
                    }
                  </p>
                </div>
              )
            )}

            {/* Acciones de Exportación */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📤 Exportar Reporte</h3>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => handleExportar('pdf')}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center"
                >
                  📊 Exportar a PDF
                </button>
                <button
                  onClick={() => handleExportar('excel')}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center"
                >
                  📝 Exportar a Excel
                </button>
                <button
                  onClick={() => handleExportar('csv')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center"
                >
                  💾 Exportar a CSV
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReporteFiltros;