import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

interface DashboardStats {
  accesosFiltro: number;
  accesosHoy: number;
  identificacionesRetenidas: number;
  actividadesRecientes: number;
}

const SupervisorDashboard: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    accesosFiltro: 0,
    accesosHoy: 0,
    identificacionesRetenidas: 0,
    actividadesRecientes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [accesosRes, auditoriaRes] = await Promise.all([
        api.get('/accesos'),
        api.get('/auditoria/filtro?limit=1') // Igual que el superadmin - solo necesitamos el total
      ]);

      const accesosData = Array.isArray(accesosRes.data) ? accesosRes.data :
        accesosRes.data?.data || accesosRes.data?.accesos || [];

      // Filtrar accesos de hoy
      const accesosHoy = accesosData.filter((acceso: any) => {
        if (!acceso || !acceso.horaEntrada) return false;
        const hoy = new Date().toDateString();
        const fechaAcceso = new Date(acceso.horaEntrada);
        return fechaAcceso.toDateString() === hoy;
      });

      // Usar el total de logs igual que el superadmin
      const auditoriaData = auditoriaRes.data;
      const actividadesRecientes = auditoriaData?.total || 0;

      const identificacionesRetenidas = accesosData.filter((acceso: any) =>
        acceso && !acceso.horaSalida && acceso.identificacion !== null).length;

      setStats({
        accesosFiltro: accesosData.length,
        accesosHoy: accesosHoy.length,
        identificacionesRetenidas,
        actividadesRecientes
      });

    } catch (error: any) {
      console.error('❌ Error fetching supervisor dashboard data:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      } else {
        // Si falla la auditoría, usar solo datos de accesos
        await fetchDataSoloConAccesos();
      }
    } finally {
      setLoading(false);
    }
  };

  // Método de respaldo si falla la auditoría
  const fetchDataSoloConAccesos = async () => {
    try {
      const accesosRes = await api.get('/accesos');
      const accesosData = Array.isArray(accesosRes.data) ? accesosRes.data :
        accesosRes.data?.data || accesosRes.data?.accesos || [];

      const accesosHoy = accesosData.filter((acceso: any) => {
        if (!acceso || !acceso.horaEntrada) return false;
        const hoy = new Date().toDateString();
        const fechaAcceso = new Date(acceso.horaEntrada);
        return fechaAcceso.toDateString() === hoy;
      });

      const identificacionesRetenidas = accesosData.filter((acceso: any) =>
        acceso && !acceso.horaSalida && acceso.identificacion !== null).length;

      setStats({
        accesosFiltro: accesosData.length,
        accesosHoy: accesosHoy.length,
        identificacionesRetenidas,
        actividadesRecientes: accesosHoy.length // Usamos accesos hoy como respaldo
      });
    } catch (error) {
      console.error('Error fetching solo accesos:', error);
    }
  };

  // Funciones de navegación
  const navigateToAccesos = () => navigate('/accesos');
  const navigateToReportes = () => navigate('/reportes/filtros');
  const navigateToIdentificaciones = () => navigate('/identificaciones/');
  const navigateToIdentificacionesRetenidas = () => navigate('/identificaciones/retenidas');
  const navigateToLogsAuditoria = () => navigate('/filtro');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 to-amber-800 flex items-center justify-center">
        <div className="text-white text-xl">Cargando dashboard supervisor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 to-amber-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Grid - 4 tarjetas esenciales */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div
            onClick={navigateToAccesos}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-amber-200 text-sm font-semibold">Accesos del Filtro</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.accesosFiltro}</div>
            <div className="text-orange-400 text-xs mt-1 sm:mt-2">Registros totales</div>
          </div>

          <div
            onClick={navigateToAccesos}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-amber-200 text-sm font-semibold">Accesos Hoy</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.accesosHoy}</div>
            <div className="text-green-400 text-xs mt-1 sm:mt-2">Actividad del día</div>
          </div>

          <div
            onClick={navigateToIdentificaciones}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-amber-200 text-sm font-semibold">ID Retenidas</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.identificacionesRetenidas}</div>
            <div className="text-red-400 text-xs mt-1 sm:mt-2">Todos los filtros</div>
          </div>

          <div
            onClick={navigateToLogsAuditoria}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-amber-200 text-sm font-semibold">Actividad Reciente</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.actividadesRecientes}</div>
            <div className="text-purple-400 text-xs mt-1 sm:mt-2">Todos los registros</div>
          </div>
        </div>

        {/* MÓDULOS PRINCIPALES - UNIFICADOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
          {/* CONSULTA DE REGISTROS */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 text-lg">🔍 Consulta de Registros</h3>
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={navigateToAccesos}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
              >
                <span className="mr-3">📋</span>
                Consultar Registros
              </button>
              <p className="text-amber-200 text-sm text-center mt-2">
                Consultar registros de este filtro y visualizar otros filtros (solo lectura)
              </p>
            </div>
          </div>

          {/* REPORTES PARCIALES */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 text-lg">📊 Generación de Reportes</h3>
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={navigateToReportes}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
              >
                <span className="mr-3">📈</span>
                Generar Reportes Parciales
              </button>
              <p className="text-amber-200 text-sm text-center mt-2">
                Reportes parciales específicos de esta zona o filtro
              </p>
            </div>
          </div>
        </div>

        {/* MÓDULOS DE MONITOREO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LOGS DE ACTIVIDAD */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 text-lg">📋 Monitoreo de Actividad</h3>
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={navigateToLogsAuditoria}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
              >
                <span className="mr-3">👁️</span>
                Ver Logs de Actividad
              </button>
              <p className="text-amber-200 text-sm text-center">
                Visualizar logs de actividad relacionados con este filtro
              </p>
            </div>
          </div>

          {/* IDENTIFICACIONES RETENIDAS */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 text-lg">🆔 Control de Identificaciones</h3>
            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={navigateToIdentificacionesRetenidas}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
              >
                <span className="mr-3">📋</span>
                Identificaciones Retenidas
              </button>
              <p className="text-amber-200 text-sm text-center">
                Visualizar identificaciones retenidas de todos los filtros
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;