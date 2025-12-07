import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

interface DashboardStats {
  usuariosall: number;
  accesosTotales: number;
  identificacionesRetenidas: number;
  registrosAuditoria: number;
  filtrosActivos: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    usuariosall: 0,
    accesosTotales: 0,
    identificacionesRetenidas: 0,
    registrosAuditoria: 0,
    filtrosActivos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [usuariosRes, accesosRes, auditoriaRes, filtrosRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/accesos'),
        api.get('/auditoria/filtro?limit=1'),
        api.get('/filtros/activos')
      ]);

      // Procesar datos de usuarios
      const usuariosData = Array.isArray(usuariosRes.data) ? usuariosRes.data :
        usuariosRes.data?.data || usuariosRes.data?.usuarios || [];

      // Procesar datos de accesos
      const accesosData = Array.isArray(accesosRes.data) ? accesosRes.data :
        accesosRes.data?.data || accesosRes.data?.accesos || [];

      // Procesar datos de auditoría
      const auditoriaData = auditoriaRes.data;
      const registrosAuditoria = auditoriaData?.total || 0;

      // Procesar datos de filtros
      const filtrosData = Array.isArray(filtrosRes.data) ? filtrosRes.data : [];
      const filtrosActivos = filtrosData.length;

      // Contar usuarios activos
      const usuariosall = usuariosData.filter((u: any) =>
        u && u.estaActivo !== false).length;

      // Cambiar identificacionId por identificacion
      const identificacionesRetenidas = accesosData.filter((acceso: any) =>
        acceso && !acceso.horaSalida && acceso.identificacion !== null).length;

      setStats({
        usuariosall,
        accesosTotales: accesosData.length,
        identificacionesRetenidas,
        registrosAuditoria,
        filtrosActivos
      });

    } catch (error) {
      console.error('❌ Error fetching admin dashboard data:', error);
      // Si hay error en algún endpoint, intentar cargar datos básicos
      try {
        const [usuariosRes, accesosRes] = await Promise.all([
          api.get('/usuarios'),
          api.get('/accesos')
        ]);

        const usuariosData = Array.isArray(usuariosRes.data) ? usuariosRes.data :
          usuariosRes.data?.data || usuariosRes.data?.usuarios || [];

        const accesosData = Array.isArray(accesosRes.data) ? accesosRes.data :
          accesosRes.data?.data || accesosRes.data?.accesos || [];

        const usuariosall = usuariosData.filter((u: any) =>
          u && u.estaActivo !== false).length;

        // Cambiar identificacionId por identificacion
        const identificacionesRetenidas = accesosData.filter((acceso: any) =>
          acceso && !acceso.horaSalida && acceso.identificacion !== null).length;

        setStats({
          usuariosall,
          accesosTotales: accesosData.length,
          identificacionesRetenidas,
          registrosAuditoria: 0,
          filtrosActivos: 0
        });
      } catch (fallbackError) {
        console.error('❌ Error en carga de respaldo:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Funciones de navegación
  const navigateToUsuarios = () => navigate('/usuarios');
  const navigateToAccesos = () => navigate('/accesos');
  const navigateToReportes = () => navigate('/reportes');
  const navigateToIdentificaciones = () => navigate('/identificaciones');
  const navigateToIdentificacionesRetenidas = () => navigate('/identificaciones/retenidas');
  const navigateToLogsAuditoria = () => navigate('/logs/sistema');
  const navigateToImportarDB = () => navigate('/importar');
  const navigateToGestionTurnos = () => navigate('/turnos');
  const navigateToGestionFiltros = () => navigate('/filtros');
  const navigateToTIAS = () => navigate('/tias');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800 flex items-center justify-center">
        <div className="text-white text-xl">Cargando dashboard administrativo...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-emerald-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div
            onClick={navigateToUsuarios}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 sm:p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-emerald-200 text-sm font-semibold">Personal Activo</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.usuariosall}</div>
            <div className="text-green-400 text-xs mt-1">Operativos/Supervisores</div>
          </div>

          <div
            onClick={navigateToAccesos}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 sm:p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-emerald-200 text-sm font-semibold">Total Accesos</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.accesosTotales}</div>
            <div className="text-blue-400 text-xs mt-1">Todos los registros</div>
          </div>

          <div
            onClick={navigateToIdentificaciones}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 sm:p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-emerald-200 text-sm font-semibold">ID Retenidas</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.identificacionesRetenidas}</div>
            <div className="text-yellow-400 text-xs mt-1">Todos los Controles de acceso</div>
          </div>

          <div
            onClick={navigateToLogsAuditoria}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 sm:p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-emerald-200 text-sm font-semibold">Registros Auditoría</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.registrosAuditoria}</div>
            <div className="text-purple-400 text-xs mt-1">Actividad del sistema</div>
          </div>

          <div
            onClick={navigateToGestionFiltros}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 sm:p-4 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200 col-span-2 lg:col-span-1"
          >
            <div className="text-emerald-200 text-sm font-semibold">Controles de acceso Activos</div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1">{stats.filtrosActivos}</div>
            <div className="text-indigo-400 text-xs mt-1">Puntos de control</div>
          </div>
        </div>

        {/* Módulos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
          {/* Gestión del Sistema */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 text-lg">👥 Gestión del Sistema</h3>
            <div className="space-y-3">
              <button
                onClick={navigateToUsuarios}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              >
                <span className="mr-3">📋</span>
                Gestionar Personal
              </button>
              <button
                onClick={navigateToGestionTurnos}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              >
                <span className="mr-3">🕐</span>
                Gestionar Turnos
              </button>
              <button
                onClick={navigateToGestionFiltros}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              >
                <span className="mr-3">🔍</span>
                Gestionar Control de acceso
              </button>
              <button
                onClick={navigateToTIAS}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              >
                <span className="mr-3">🪪</span>
                Gestionar Gafetes de visitante
              </button>
              <p className="text-emerald-200 text-sm text-center mt-2">
                Administrar usuarios, turnos, Controles de acceso y accesos del sistema
              </p>
            </div>
          </div>

          {/* Análisis y Control */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 text-lg">📈 Análisis y Control</h3>
            <div className="space-y-3">
              <button
                onClick={navigateToReportes}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              >
                <span className="mr-3">📊</span>
                Generar Reportes
              </button>
              <button
                onClick={navigateToLogsAuditoria}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              >
                <span className="mr-3">👁️</span>
                Ver Logs de Auditoría
              </button>
              <button
                onClick={navigateToIdentificacionesRetenidas}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              >
                <span className="mr-3">🆔</span>
                Identificaciones Retenidas
              </button>
              <button
                onClick={navigateToAccesos}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
              >
                <span className="mr-3">👀</span>
                Consultar Todos los Accesos
              </button>
              <p className="text-emerald-200 text-sm text-center">
                Reportes globales, auditoría del sistema, control de identificaciones y accesos del sistema
              </p>
            </div>
          </div>
        </div>

        {/* Importación de Datos */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 max-w-2xl mx-auto">
          <h3 className="text-white font-semibold mb-4 text-lg">💾 Importación de Datos</h3>
          <div className="space-y-4">
            <button
              onClick={navigateToImportarDB}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
            >
              <span className="mr-3">📥</span>
              Importar Registros SQL
            </button>
            <p className="text-emerald-200 text-sm text-center">
              Importar registros de otros Controles de acceso para información unificada
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;