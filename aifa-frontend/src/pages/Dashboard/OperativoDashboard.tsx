import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

interface DashboardStats {
  misAccesosRegistrados: number;
  pendientesSalida: number;
  identificacionesRetenidas: number;
  turnoActivo: boolean;
}

const OperativoDashboard: React.FC = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    misAccesosRegistrados: 0,
    pendientesSalida: 0,
    identificacionesRetenidas: 0,
    turnoActivo: false
  });
  const [loading, setLoading] = useState(true);
  const [turnoAsignado, setTurnoAsignado] = useState<any>(null);

  useEffect(() => {
    if (usuario?.rol === 'OPERATIVO' && (!usuario?.nombre?.trim() || !usuario?.apellidos?.trim())) {
      navigate('/nombre-ingreso', { replace: true });
    }
  }, [usuario, navigate]);

  // Determinar si el operativo tiene Control de acceso asignado
  const tieneFiltroAsignado = usuario?.filtroAsignadoId !== null && usuario?.filtroAsignadoId !== undefined;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [accesosRes, turnosRes, usuarioRes] = await Promise.all([
        api.get('/accesos'),
        api.get('/turnos/activos'),
        api.get(`/usuarios/${usuario?.id}`) // Obtener datos completos del usuario
      ]);

      const accesosData = Array.isArray(accesosRes.data) ? accesosRes.data :
        accesosRes.data?.data || accesosRes.data?.accesos || [];

      const turnosData = Array.isArray(turnosRes.data) ? turnosRes.data :
        turnosRes.data?.data || turnosRes.data?.turnos || [];

      const usuarioData = usuarioRes.data;

      // Filtrar accesos según si tiene Control de acceso
      let misAccesos = [];
      if (tieneFiltroAsignado) {
        // Si tiene filtro, solo ve los accesos de su filtro
        misAccesos = accesosData.filter((acceso: any) =>
          acceso && acceso.filtroId === usuario?.filtroAsignadoId
        );
      } else {
        // Si no tiene Control de acceso, ve todos los accesos (solo lectura)
        misAccesos = accesosData;
      }

      // Pendientes de salida (solo los que puede ver según su Control de acceso)
      const pendientesSalida = misAccesos.filter((a: any) => a && !a.horaSalida).length;

      const identificacionesRetenidas = accesosData.filter((acceso: any) =>
        acceso && !acceso.horaSalida && acceso.identificacion !== null).length;

      // Verificar si el usuario está asignado a algún turno activo
      let turnoActivo = false;
      let turnoUsuario = null;

      if (usuarioData.turnosAsignados && usuarioData.turnosAsignados.length > 0) {
        const turnoActivoUsuario = usuarioData.turnosAsignados.find((asignacion: any) =>
          asignacion.turno && asignacion.turno.estaActivo
        );

        if (turnoActivoUsuario) {
          turnoActivo = true;
          turnoUsuario = turnoActivoUsuario.turno;
        }
      }

      // ALTERNATIVA: Buscar en todos los turnos activos
      if (!turnoActivo) {
        const turnoEncontrado = turnosData.find((turno: any) =>
          turno.usuarios?.some((usuarioTurno: any) => usuarioTurno.usuarioId === usuario?.id)
        );
        if (turnoEncontrado) {
          turnoActivo = true;
          turnoUsuario = turnoEncontrado;
        }
      }

      setTurnoAsignado(turnoUsuario);
      setStats({
        misAccesosRegistrados: misAccesos.length,
        pendientesSalida,
        identificacionesRetenidas,
        turnoActivo
      });

    } catch (error: any) {
      console.error('❌ Error fetching operativo dashboard data:', error);
      if (error.response?.status === 401) {
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToCrearAcceso = () => {
    if (tieneFiltroAsignado) {
      navigate('/accesos/crear');
    }
  };

  const navigateToCrearAccesoEspecial = () => {
    if (tieneFiltroAsignado) {
      navigate('/accesospecial/crear');
    }
  };

  const navigateToAccesos = () => navigate('/accesos');

  const navigateToIdentificacionesRetenidas = () => {
    if (tieneFiltroAsignado) {
      navigate('/identificaciones/retenidas');
    }
  };

  const navigateToIdentificaciones = () => {
    if (tieneFiltroAsignado) {
      navigate('/identificaciones');
    }
  };

  const navigateToExportar = () => {
    if (tieneFiltroAsignado) {
      navigate('/exportar');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-cyan-800 flex items-center justify-center">
        <div className="text-white text-xl">Cargando dashboard operativo...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-cyan-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Stats Grid - 4 tarjetas esenciales (siempre visibles) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div
            onClick={navigateToAccesos}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-cyan-200 text-sm font-semibold">
              {tieneFiltroAsignado ? 'Mis Registros' : 'Total Registros'}
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.misAccesosRegistrados}</div>
            <div className="text-green-400 text-xs mt-1 sm:mt-2">
              {tieneFiltroAsignado ? 'Accesos de mi filtro' : 'Todos los accesos'}
            </div>
          </div>

          <div
            onClick={navigateToAccesos}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition duration-200"
          >
            <div className="text-cyan-200 text-sm font-semibold">Pendientes Salida</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.pendientesSalida}</div>
            <div className="text-yellow-400 text-xs mt-1 sm:mt-2">
              {tieneFiltroAsignado ? 'En mi filtro' : 'Todos los filtros'}
            </div>
          </div>

          <div
            onClick={tieneFiltroAsignado ? navigateToIdentificaciones : undefined}
            className={`bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 ${tieneFiltroAsignado ? 'cursor-pointer hover:bg-white/20' : 'opacity-70'
              } transition duration-200`}
          >
            <div className="text-cyan-200 text-sm font-semibold">ID Retenidas</div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mt-1 sm:mt-2">{stats.identificacionesRetenidas}</div>
            <div className="text-orange-400 text-xs mt-1 sm:mt-2">
              {tieneFiltroAsignado ? 'Todos los filtros' : 'Solo lectura'}
            </div>
          </div>

          <div
            className={`bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20 ${tieneFiltroAsignado ? 'hover:bg-white/20' : 'opacity-70'
              } transition duration-200`}
          >
            <div className="text-cyan-200 text-sm font-semibold">Estado Turno</div>
            <div className={`text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2 ${stats.turnoActivo ? 'text-green-400' : 'text-red-400'}`}>
              {stats.turnoActivo ? 'ACTIVO' : 'INACTIVO'}
            </div>
            <div className="text-blue-400 text-xs mt-1 sm:mt-2">
              {stats.turnoActivo
                ? (turnoAsignado?.nombreTurno || 'En operación')
                : 'Sin turno asignado'
              }
            </div>
          </div>
        </div>

        {/* MÓDULOS PRINCIPALES - CONDICIONALES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
          {/* REGISTRO Y GESTIÓN DE ACCESOS */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-white font-semibold mb-4 text-lg">🚪 Control de Accesos</h3>
            <div className="space-y-3 sm:space-y-4">
              {/* SOLO OPERATIVOS CON Control de acceso pueden registrar accesos */}
              {tieneFiltroAsignado ? (
                <>
                  <button
                    onClick={navigateToCrearAcceso}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
                  >
                    <span className="mr-3">📝</span>
                    Registrar Acceso
                  </button>
                  <button
                    onClick={navigateToCrearAccesoEspecial}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
                  >
                    <span className="mr-3">📝</span>
                    Registrar Acceso Especial
                  </button>
                  <button
                    onClick={navigateToAccesos}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
                  >
                    <span className="mr-3">👁️</span>
                    Ver Registros del Control de acceso
                  </button>
                  <p className="text-cyan-200 text-sm text-center mt-2">
                    Registrar accesos y salidas de visitantes
                  </p>
                </>
              ) : (
                // OPERATIVOS SIN Control de acceso solo pueden ver registros
                <>
                  <button
                    onClick={navigateToAccesos}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
                  >
                    <span className="mr-3">👁️</span>
                    Ver Registros del Control de acceso
                  </button>
                  <p className="text-yellow-200 text-sm text-center mt-2">
                    Modo solo lectura - Sin Control de acceso asignado para registrar accesos
                  </p>
                </>
              )}
            </div>
          </div>

          {/* GESTIÓN DE TURNOS Y DATOS - SOLO CON Control de acceso */}
          {tieneFiltroAsignado && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-white/20">
              <h3 className="text-white font-semibold mb-4 text-lg">🔄 Gestión Operativa</h3>
              <div className="space-y-3 sm:space-y-4">
                {tieneFiltroAsignado && (
                  <div className="space-y-3 sm:space-y-4">
                    <button
                      onClick={navigateToIdentificacionesRetenidas}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
                    >
                      <span className="mr-3">📋</span>
                      Identificaciones Retenidas
                    </button>
                  </div>
                )}
                {!tieneFiltroAsignado && (
                  <div className="mt-6 sm:mt-8 bg-yellow-500/20 backdrop-blur-lg rounded-2xl p-4 sm:p-6 border border-yellow-400/30 text-center">
                    <div className="text-yellow-200 text-base sm:text-lg font-semibold mb-2">
                      ⚠️ Modo Solo Lectura
                    </div>
                  </div>
                )}
                <button
                  onClick={navigateToExportar}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 sm:py-4 px-4 rounded-lg transition duration-200 flex items-center justify-center text-base sm:text-lg"
                >
                  <span className="mr-3">💾</span>
                  Exportar Registros
                </button>
                <p className="text-cyan-200 text-sm text-center mt-2">
                  Visualizar identificaciones retenidas y exportar registros para consolidación
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperativoDashboard;