import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import Navbar from '../../components/Navbar';

interface DashboardStats {
  totalUsuarios: number;
  totalAccesos: number;
  accesosHoy: number;
  identificacionesRetenidas: number;
  totalLogs: number;
}

const SuperadminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsuarios: 0,
    totalAccesos: 0,
    accesosHoy: 0,
    identificacionesRetenidas: 0,
    totalLogs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usuariosRes, accesosRes, auditoriaRes,] = await Promise.all([
        api.get('/usuarios'),
        api.get('/accesos'),
        api.get('/auditoria/filtro?limit=1')
      ]);

      const usuariosData = Array.isArray(usuariosRes.data) ? usuariosRes.data :
        usuariosRes.data?.data || usuariosRes.data?.usuarios || [];

      const accesosData = Array.isArray(accesosRes.data) ? accesosRes.data :
        accesosRes.data?.data || accesosRes.data?.accesos || [];

      const auditoriaData = auditoriaRes.data;
      const totalLogs = auditoriaData?.total || 0;

      const accesosHoy = accesosData.filter((acceso: any) => {
        if (!acceso || !acceso.horaEntrada) return false;
        const hoy = new Date().toDateString();
        const fechaAcceso = new Date(acceso.horaEntrada);
        return fechaAcceso.toDateString() === hoy;
      }).length;

      const identificacionesRetenidas = accesosData.filter((acceso: any) =>
        acceso && !acceso.horaSalida && acceso.identificacion !== null).length;

      setStats({
        totalUsuarios: usuariosData.length,
        totalAccesos: accesosData.length,
        accesosHoy,
        identificacionesRetenidas,
        totalLogs
      });

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funciones de navegación
  const navigateToUsuarios = () => navigate('/usuarios');
  const navigateToAccesos = () => navigate('/accesos');
  const navigateToReportes = () => navigate('/reportes');
  const navigateToIdentificaciones = () => navigate('/identificaciones/');
  const navigateToIdentificacionesRetenidas = () => navigate('/identificaciones/retenidas');
  const navigateToLogsAuditoria = () => navigate('/logs/sistema');
  const navigateToExportarDB = () => navigate('/exportar');
  const navigateToImportarDB = () => navigate('/importar');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-800 flex items-center justify-center">
        <div className="text-white text-xl">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-800">
      <Navbar />

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div
            onClick={navigateToUsuarios}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-blue-200 text-sm font-semibold">Total Usuarios</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.totalUsuarios}</div>
            <div className="text-green-400 text-xs mt-1 sm:mt-2">Gestión completa</div>
          </div>

          <div
            onClick={navigateToAccesos}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-blue-200 text-sm font-semibold">Accesos Hoy</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.accesosHoy}</div>
            <div className="text-blue-400 text-xs mt-1 sm:mt-2">Registros totales</div>
          </div>

          <div
            onClick={navigateToIdentificaciones}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-blue-200 text-sm font-semibold">ID Retenidas</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.identificacionesRetenidas}</div>
            <div className="text-yellow-400 text-xs mt-1 sm:mt-2">Control total</div>
          </div>

          <div
            onClick={navigateToLogsAuditoria}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-blue-200 text-sm font-semibold">Registros Auditoría</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white mt-1">{stats.totalLogs}</div>
            <div className="text-purple-400 text-xs mt-1 sm:mt-2">Acceso completo</div>
          </div>
        </div>

        {/* Módulos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
          {/* Gestión de Usuarios */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 text-lg">👥 Gestión de Usuarios</h3>
            <div className="space-y-4">
              <button
                onClick={navigateToUsuarios}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
              >
                <span className="mr-3">📋</span>
                Administrar Usuarios
              </button>
              <p className="text-blue-200 text-sm text-center">
                Crear, editar, eliminar y gestionar roles de todos los usuarios del sistema
              </p>
            </div>
          </div>

          {/* Control de Identificaciones */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 text-lg">🆔 Identificaciones Retenidas</h3>
            <div className="space-y-4">
              <button
                onClick={navigateToIdentificacionesRetenidas}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
              >
                <span className="mr-3">📋</span>
                Gestionar Identificaciones
              </button>
              <p className="text-blue-200 text-sm text-center">
                Visualizar y controlar todas las identificaciones retenidas en el sistema
              </p>
            </div>
          </div>
        </div>

        {/* Base de Datos y Auditoría */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
          {/* Gestión de Base de Datos */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 text-lg">💾 Base de Datos</h3>
            <div className="space-y-4">
              <button
                onClick={navigateToExportarDB}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
              >
                <span className="mr-3">📤</span>
                Exportar Backup SQL
              </button>
              <button
                onClick={navigateToImportarDB}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
              >
                <span className="mr-3">📥</span>
                Importar/Respaldar
              </button>
              <p className="text-blue-200 text-sm text-center">
                Exportar e importar la base de datos en formato SQL para consolidación o respaldo
              </p>
            </div>
          </div>

          {/* Auditoría y Reportes */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 text-lg">📊 Auditoría y Reportes</h3>
            <div className="space-y-4">
              <button
                onClick={navigateToLogsAuditoria}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
              >
                <span className="mr-3">📋</span>
                Logs de Auditoría
              </button>
              <button
                onClick={navigateToReportes}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
              >
                <span className="mr-3">📈</span>
                Reportes Completos
              </button>
              <p className="text-blue-200 text-sm text-center">
                Acceso total a todos los registros, reportes y logs de auditoría del sistema
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperadminDashboard;