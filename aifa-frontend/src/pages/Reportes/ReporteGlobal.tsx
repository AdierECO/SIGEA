import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Acceso, Turno, Usuario, ReporteGlobalResponse } from '../../types';
import Navbar from '../../components/Navbar';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

interface EstadisticasLocales {
  totalAccesos: number;
  accesosActivos: number;
  identificacionesRetenidas: number;
  conAcompanante: number;
  totalTurnos: number;
  turnosActivos: number;
  usuariosActivos: number;
  accesosConFiltro: number;
}

const ReporteGlobal: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [datos, setDatos] = useState({
    accesos: [] as Acceso[],
    turnos: [] as Turno[],
    usuarios: [] as Usuario[]
  });
  const [estadisticasBackend, setEstadisticasBackend] = useState<ReporteGlobalResponse['estadisticas'] | null>(null);
  const [agrupacionesBackend, setAgrupacionesBackend] = useState<ReporteGlobalResponse['agrupaciones'] | null>(null);

  useEffect(() => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    
    setFechaInicio(inicio.toISOString().split('T')[0]);
    setFechaFin(fin.toISOString().split('T')[0]);
    
    fetchDatos(inicio, fin);
  }, []);

  const fetchDatos = async (inicio: Date, fin: Date) => {
    try {
      setLoading(true);
      
      const response = await api.get<ReporteGlobalResponse>('/reportes/global', {
        params: {
          fechaInicio: inicio.toISOString(),
          fechaFin: fin.toISOString(),
          incluirEstadisticas: 'true'
        }
      });

      if (response.data.success) {
        const { datos: datosBackend, estadisticas, agrupaciones } = response.data;

        setDatos({
          accesos: datosBackend.accesos || [],
          turnos: datosBackend.turnos || [],
          usuarios: datosBackend.usuarios || []
        });
        
        setEstadisticasBackend(estadisticas);
        setAgrupacionesBackend(agrupaciones);
      }
    } catch (error) {
      console.error('❌ Error fetching report data:', error);
      alert('Error al cargar los datos del reporte');
    } finally {
      setLoading(false);
    }
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

    fetchDatos(inicio, fin);
  };

  const handleExportar = async (formato: 'pdf' | 'excel' | 'csv') => {
    try {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);

      const exportData = {
        formato,
        fechaInicio: inicio.toISOString(),
        fechaFin: fin.toISOString(),
        tipoReporte: 'global'
      };

      const response = await api.post('/reportes/exportar', exportData, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `reporte_global_${fechaInicio}_a_${fechaFin}.${formato === 'excel' ? 'xlsx' : formato}`;
      
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

  const estadisticas: EstadisticasLocales = estadisticasBackend ? {
    totalAccesos: estadisticasBackend.totalAccesos,
    accesosActivos: estadisticasBackend.accesosActivos,
    identificacionesRetenidas: estadisticasBackend.identificacionesRetenidas,
    conAcompanante: estadisticasBackend.conAcompanante,
    totalTurnos: estadisticasBackend.totalTurnos,
    turnosActivos: estadisticasBackend.turnosActivos,
    usuariosActivos: estadisticasBackend.usuariosActivos,
    accesosConFiltro: estadisticasBackend.accesosConFiltro
  } : {
    totalAccesos: datos.accesos.length,
    accesosActivos: datos.accesos.filter(a => !a.horaSalida).length,
    identificacionesRetenidas: datos.accesos.filter(a => a.identificacionId).length,
    conAcompanante: datos.accesos.filter(a => a.tieneAcompanante).length,
    totalTurnos: datos.turnos.length,
    turnosActivos: datos.turnos.filter(t => t.estaActivo).length,
    usuariosActivos: datos.usuarios.filter(u => u.estaActivo).length,
    accesosConFiltro: datos.accesos.filter(a => a.filtroId).length
  };

  const accesosPorArea = agrupacionesBackend?.porArea || datos.accesos.reduce((acc: Record<string, number>, acceso) => {
    const area = acceso.area || 'Sin área especificada';
    acc[area] = (acc[area] || 0) + 1;
    return acc;
  }, {});

  const accesosPorMotivo = agrupacionesBackend?.porMotivo || datos.accesos.reduce((acc: Record<string, number>, acceso) => {
    const motivo = acceso.motivo || 'Sin motivo especificado';
    const motivoCorto = motivo.length > 25 ? motivo.substring(0, 25) + '...' : motivo;
    acc[motivoCorto] = (acc[motivoCorto] || 0) + 1;
    return acc;
  }, {});

  const accesosPorFiltro = agrupacionesBackend?.porFiltro || datos.accesos.reduce((acc: Record<string, number>, acceso) => {
    const filtroNombre = acceso.filtro?.nombre || 'Sin filtro';
    acc[filtroNombre] = (acc[filtroNombre] || 0) + 1;
    return acc;
  }, {});

  const diasPeriodo = estadisticasBackend?.diasPeriodo || 
    Math.ceil((new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24)) + 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Generando reporte...</div>
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Reporte Global</h1>
              <p className="text-gray-600">Análisis completo de accesos y estadísticas</p>
              
              {/* Navegación entre vistas */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white">
                  📊 Vista Global
                </button>
                <Link 
                  to="/reportes/filtros"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
                >
                  🚪 Vista por Filtros
                </Link>
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

        {/* Filtros Simples */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🌍 Rango de Fechas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
            <div>
              <button
                onClick={handleFiltrar}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center"
              >
                🔍 Aplicar Filtro
              </button>
            </div>
          </div>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{estadisticas.totalAccesos}</div>
            <div className="text-sm text-gray-600">Total Accesos</div>
            <div className="text-xs text-gray-500 mt-1">
              {diasPeriodo > 0 ? `${Math.round(estadisticas.totalAccesos / diasPeriodo)}/día` : '0/día'}
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

        {/* Grid de Reportes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accesos por Área */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Accesos por Área</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {Object.entries(accesosPorArea)
                .sort(([,a], [,b]) => (b as number) - (a as number))
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

          {/* Estadísticas del Sistema */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Estadísticas del Sistema</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Turnos:</span>
                <span className="font-semibold">{estadisticas.totalTurnos}</span>
              </div>
              <div className="flex justify-between">
                <span>Turnos Activos:</span>
                <span className="font-semibold text-green-600">{estadisticas.turnosActivos}</span>
              </div>
              <div className="flex justify-between">
                <span>Usuarios Activos:</span>
                <span className="font-semibold text-blue-600">{estadisticas.usuariosActivos}</span>
              </div>
              <div className="flex justify-between">
                <span>Accesos con Filtro:</span>
                <span className="font-semibold text-purple-600">{estadisticas.accesosConFiltro}</span>
              </div>
              <div className="flex justify-between">
                <span>Días analizados:</span>
                <span className="font-semibold">{diasPeriodo} días</span>
              </div>
            </div>
          </div>

          {/* Accesos por Motivo */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Accesos por Motivo</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {Object.entries(accesosPorMotivo)
                .sort(([,a], [,b]) => (b as number) - (a as number))
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

          {/* Accesos por Filtro */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚪 Accesos por Filtro</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {Object.entries(accesosPorFiltro)
                .sort(([,a], [,b]) => (b as number) - (a as number))
                .map(([filtro, count]) => (
                <div key={filtro} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex-1 truncate" title={filtro}>{filtro}</span>
                  <div className="flex items-center w-32">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
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
        </div>

        {/* Resumen Ejecutivo */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Resumen Ejecutivo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-3">
              <div className="flex justify-between p-2 bg-blue-50 rounded">
                <span className="font-medium">Período analizado:</span>
                <span className="font-semibold">
                  {new Date(fechaInicio).toLocaleDateString()} - {new Date(fechaFin).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 rounded">
                <span className="font-medium">Promedio diario de accesos:</span>
                <span className="font-semibold">
                  {diasPeriodo > 0 ? Math.round(estadisticas.totalAccesos / diasPeriodo) : 0} por día
                </span>
              </div>
              <div className="flex justify-between p-2 bg-orange-50 rounded">
                <span className="font-medium">Tasa de identificación retenida:</span>
                <span className="font-semibold">
                  {estadisticas.totalAccesos > 0 ? 
                    `${((estadisticas.identificacionesRetenidas / estadisticas.totalAccesos) * 100).toFixed(1)}%` 
                    : '0%'}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between p-2 bg-red-50 rounded">
                <span className="font-medium">Eficiencia en registro de salidas:</span>
                <span className="font-semibold text-green-600">
                  {estadisticas.totalAccesos > 0 ? 
                    `${(((estadisticas.totalAccesos - estadisticas.accesosActivos) / estadisticas.totalAccesos) * 100).toFixed(1)}%` 
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-purple-50 rounded">
                <span className="font-medium">Visitantes con acompañante:</span>
                <span className="font-semibold">
                  {estadisticas.totalAccesos > 0 ? 
                    `${((estadisticas.conAcompanante / estadisticas.totalAccesos) * 100).toFixed(1)}%` 
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span className="font-medium">Accesos con filtro asignado:</span>
                <span className="font-semibold">
                  {estadisticas.totalAccesos > 0 ? 
                    `${((estadisticas.accesosConFiltro / estadisticas.totalAccesos) * 100).toFixed(1)}%` 
                    : '0%'}
                </span>
              </div>
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
};

export default ReporteGlobal;