import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api'; // Importa tu API

const Navbar: React.FC = () => {
  const { usuario: contextUsuario, logout, updateUsuario } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [usuarioActualizado, setUsuarioActualizado] = useState(contextUsuario);
  const [cargandoUsuario, setCargandoUsuario] = useState(false);

  // Efecto para cargar usuario desde la BD solo una vez al inicio
  useEffect(() => {
    const cargarUsuarioDesdeBD = async () => {
      if (!contextUsuario?.id || cargandoUsuario) return;
      
      try {
        setCargandoUsuario(true);
        const response = await api.get(`/usuarios/${contextUsuario.id}`);
        const usuarioBD = response.data;
        
        // Actualizar el estado local
        setUsuarioActualizado(usuarioBD);
        
        // También actualizar el contexto de autenticación
        updateUsuario({
          nombre: usuarioBD.nombre,
          apellidos: usuarioBD.apellidos
        });
        
      } catch (error) {
        console.error('Error al cargar usuario desde BD:', error);
        // Si falla, usar el usuario del contexto
        setUsuarioActualizado(contextUsuario);
      } finally {
        setCargandoUsuario(false);
      }
    };

    // Solo cargar si tenemos un ID de usuario
    if (contextUsuario?.id) {
      cargarUsuarioDesdeBD();
    }
  }, [contextUsuario?.id]); // Solo se ejecuta cuando cambia el ID del usuario

  // Efecto para actualizar cuando cambia el contexto
  useEffect(() => {
    if (contextUsuario) {
      setUsuarioActualizado(contextUsuario);
    }
  }, [contextUsuario]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error en logout:', error);
      navigate('/login');
    }
  };

  const handleInicio = () => {
    const userRole = usuarioActualizado?.rol;
    switch (userRole) {
      case 'SUPERADMIN':
        navigate('/superadmin');
        break;
      case 'ADMINISTRADOR':
        navigate('/admin');
        break;
      case 'SUPERVISOR':
        navigate('/supervisor');
        break;
      case 'OPERATIVO':
        navigate('/operativo');
        break;
      default:
        navigate('/dashboard');
    }
    setIsMobileMenuOpen(false);
  };

  const getRolColor = (rol: string) => {
    const colors = {
      'SUPERADMIN': 'from-purple-500 to-pink-500',
      'ADMINISTRADOR': 'from-green-500 to-emerald-500',
      'SUPERVISOR': 'from-orange-500 to-red-500',
      'OPERATIVO': 'from-blue-500 to-cyan-500'
    };
    return colors[rol as keyof typeof colors] || 'from-gray-500 to-gray-600';
  };

  const getRolGradient = (rol: string) => {
    const gradients = {
      'SUPERADMIN': 'bg-gradient-to-r from-purple-500 to-pink-500',
      'ADMINISTRADOR': 'bg-gradient-to-r from-green-500 to-emerald-500',
      'SUPERVISOR': 'bg-gradient-to-r from-orange-500 to-red-500',
      'OPERATIVO': 'bg-gradient-to-r from-blue-500 to-cyan-500'
    };
    return gradients[rol as keyof typeof gradients] || 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  const getRolText = (rol: string) => {
    const texts = {
      'SUPERADMIN': 'Super Administrador',
      'ADMINISTRADOR': 'Administrador',
      'SUPERVISOR': 'Supervisor',
      'OPERATIVO': 'Operativo'
    };
    return texts[rol as keyof typeof texts] || rol;
  };

  const getPageTitle = () => {
    const path = location.pathname;

    const pageTitles: { [key: string]: string } = {
      '/superadmin': 'Panel de Control',
      '/admin': 'Panel Administrativo',
      '/supervisor': 'Panel de Supervisión',
      '/operativo': 'Panel Operativo',
      '/dashboard': 'Dashboard Principal',

      '/usuarios': 'Gestión de Usuarios',
      '/usuarios/crear': 'Nuevo Usuario',
      '/usuarios/editar': 'Editar Usuario',

      '/turnos': 'Gestión de Turnos',
      '/turnos/crear': 'Nuevo Turno',
      '/turnos/transferir': 'Transferir Turno',
      '/turnos/asignar': 'Asignar Personal',

      '/accesos': 'Control de Accesos',
      '/accesos/crear': 'Registro de Acceso',
      '/accesos/ver': 'Detalles de Acceso',

      '/identificaciones': 'Identificaciones',
      '/identificaciones/retenidas': 'Identificaciones Retenidas',

      '/reportes': 'Reportes del Sistema',
      '/reportes/fechas': 'Reportes por Fecha',
      '/reportes/personas': 'Reportes por Persona',

      '/sistema': 'Logs del Sistema',
      '/filtro': 'Auditoría de Control de acceso',
      '/exportar': 'Exportar Datos',
      '/importar': 'Importar Datos',
      '/consolidacion': 'Consolidación'
    };

    if (pageTitles[path]) {
      return pageTitles[path];
    }

    if (path.includes('/usuarios/editar/')) return 'Editar Usuario';
    if (path.includes('/turnos/transferir/')) return 'Transferir Turno';
    if (path.includes('/turnos/asignar/')) return 'Asignar Personal';
    if (path.includes('/accesos/ver/')) return 'Detalles de Acceso';
    if (path.includes('/detalle/')) return 'Detalles de Auditoría';

    const pathSegments = path.split('/').filter(segment => segment);
    if (pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1];
      return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    }

    return 'SIGEA';
  };

  const getPageIcon = () => {
    const path = location.pathname;

    const pageIcons: { [key: string]: string } = {
      '/superadmin': '👑',
      '/admin': '⚡',
      '/supervisor': '🔍',
      '/operativo': '🛡️',
      '/dashboard': '🎯',

      '/usuarios': '👥',
      '/usuarios/crear': '✨',
      '/usuarios/editar': '✏️',

      '/turnos': '⏰',
      '/turnos/crear': '🚀',
      '/turnos/transferir': '🔄',
      '/turnos/asignar': '👨‍💼',

      '/accesos': '🚪',
      '/accesos/crear': '📝',
      '/accesos/ver': '🔎',

      '/identificaciones': '🆔',
      '/identificaciones/retenidas': '📋',

      '/reportes': '📊',
      '/reportes/fechas': '📅',
      '/reportes/personas': '👤',

      '/sistema': '⚙️',
      '/filtro': '🔦',
      '/exportar': '📤',
      '/importar': '📥',
      '/consolidacion': '🔄'
    };

    if (pageIcons[path]) {
      return pageIcons[path];
    }

    if (path.includes('/usuarios/editar/')) return '✏️';
    if (path.includes('/turnos/transferir/')) return '🔄';
    if (path.includes('/turnos/asignar/')) return '👨‍💼';
    if (path.includes('/accesos/ver/')) return '🔎';
    if (path.includes('/detalle/')) return '📋';

    return '🎯';
  };

  // Usuario que se mostrará (prioridad: BD > contexto)
  const usuarioParaMostrar = usuarioActualizado || contextUsuario;

  return (
    <>
      {/* Navbar Full Width con mejor distribución */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
          ? 'bg-gray-900/95 backdrop-blur-2xl shadow-2xl border-b border-gray-700/50'
          : 'bg-gray-900/90 backdrop-blur-2xl border-b border-gray-700/30'
        }`}>

        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 sm:h-20">

              {/* Logo y Branding - Izquierda */}
              <div className="flex items-center space-x-3 flex-shrink-0">
                <div className="relative group">
                  <div
                    onClick={handleInicio}
                    className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center shadow-lg cursor-pointer transform group-hover:scale-105 transition duration-300 border border-gray-600/50"
                  >
                    <span className="text-white font-bold text-lg sm:text-xl">SG</span>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    SIGEA
                  </h1>
                </div>
              </div>

              {/* Título de la Página Actual - Centrado */}
              <div className="flex-1 flex justify-center mx-2 sm:mx-4 lg:mx-12">
                <div className="flex items-center justify-center space-x-2 sm:space-x-4 bg-gray-800/40 backdrop-blur-lg px-4 sm:px-6 py-2 sm:py-3 rounded-xl border border-gray-600/30 max-w-xs sm:max-w-none">
                  <span className="text-xl sm:text-2xl text-white">{getPageIcon()}</span>
                  <div className="text-center">
                    <h2 className="text-sm sm:text-lg font-bold text-white truncate">
                      {getPageTitle()}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Perfil y Sesión - Derecha */}
              <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">

                {/* Información del usuario - Solo desktop */}
                <div className="hidden xl:flex items-center space-x-3 bg-gray-800/40 backdrop-blur-md rounded-xl px-3 sm:px-4 py-2 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300 group cursor-auto">
                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${getRolColor(usuarioParaMostrar?.rol || '')} shadow-md`}></div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">
                      {usuarioParaMostrar?.nombre} {usuarioParaMostrar?.apellidos}
                    </div>
                    <div className="text-xs text-gray-300">
                      {getRolText(usuarioParaMostrar?.rol || '')}
                    </div>
                  </div>
                </div>

                {/* Botón de Perfil */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="relative group"
                  >
                    <div className="relative flex items-center space-x-2 bg-gray-800/40 backdrop-blur-md border border-gray-600/30 rounded-xl px-2 sm:px-3 py-2 hover:border-gray-500/50 transition-all duration-300 group">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r ${getRolColor(usuarioParaMostrar?.rol || '')} rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg transform group-hover:scale-105 transition duration-300`}>
                        {usuarioParaMostrar?.nombre?.charAt(0)}{usuarioParaMostrar?.apellidos?.charAt(0)}
                      </div>
                      <svg
                        className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transform transition-transform duration-300 group-hover:text-white ${isProfileOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Dropdown de Perfil */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-gray-900/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-600/50 overflow-hidden z-50 animate-fade-in">

                      {/* Header del perfil */}
                      <div className="bg-gray-800 p-3 sm:p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-700 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg border border-gray-600">
                            {usuarioParaMostrar?.nombre?.charAt(0)}{usuarioParaMostrar?.apellidos?.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">
                              {usuarioParaMostrar?.nombre} {usuarioParaMostrar?.apellidos}
                            </p>
                            <p className="text-gray-300 text-xs truncate mt-1">{usuarioParaMostrar?.email}</p>
                            <div className="flex items-center mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${getRolGradient(usuarioParaMostrar?.rol || '')} text-white shadow-md`}>
                                {getRolText(usuarioParaMostrar?.rol || '')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Opciones del menú */}
                      <div className="p-2">
                        <button
                          onClick={handleInicio}
                          className="flex items-center w-full px-3 py-2 sm:py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition duration-300 group mb-2"
                        >
                          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition duration-300">
                            <span className="text-lg">🚀</span>
                          </div>
                          <div className="text-left">
                            <div className="font-semibold">Ir al Inicio</div>
                            <div className="text-xs text-gray-400">Panel principal</div>
                          </div>
                        </button>

                        <button
                          onClick={() => {navigate("/perfil"); setIsProfileOpen(false);}}
                          className="flex items-center w-full px-3 py-2 sm:py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition duration-300 group"
                        >
                          <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition duration-300">
                            <span className="text-lg">👤</span>
                          </div>
                          <div className="text-left">
                            <div className="font-semibold">Mi Perfil</div>
                            <div className="text-xs text-gray-400">Configuración</div>
                          </div>
                        </button>
                      </div>

                      {/* Cerrar Sesión */}
                      <div className="p-2 border-t border-gray-700">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-3 py-2 sm:py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition duration-300 group"
                        >
                          <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition duration-300">
                            <span className="text-lg">🔒</span>
                          </div>
                          <div className="text-left">
                            <div className="font-semibold">Cerrar Sesión</div>
                            <div className="text-xs text-red-400/60">Salir del sistema</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Menú móvil desplegable */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-gray-800/95 backdrop-blur-xl border-t border-gray-600/30 animate-fade-in">
            <div className="px-4 py-3 space-y-2">
              <div className="flex items-center space-x-3 p-3 bg-gray-700/50 rounded-lg">
                <div className={`w-8 h-8 bg-gradient-to-r ${getRolColor(usuarioParaMostrar?.rol || '')} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                  {usuarioParaMostrar?.nombre?.charAt(0)}{usuarioParaMostrar?.apellidos?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {usuarioParaMostrar?.nombre} {usuarioParaMostrar?.apellidos}
                  </p>
                  <p className="text-xs text-gray-300">{getRolText(usuarioParaMostrar?.rol || '')}</p>
                </div>
              </div>
              
              <button
                onClick={handleInicio}
                className="w-full flex items-center space-x-3 p-3 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition duration-300"
              >
                <span className="text-lg">🚀</span>
                <span className="font-medium">Ir al Inicio</span>
              </button>
              
              <button
                onClick={() => {navigate("/perfil"); setIsMobileMenuOpen(false);}}
                className="w-full flex items-center space-x-3 p-3 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition duration-300"
              >
                <span className="text-lg">👤</span>
                <span className="font-medium">Mi Perfil</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition duration-300"
              >
                <span className="text-lg">🔒</span>
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Espacio para el navbar */}
      <div className="h-16 sm:h-20"></div>

      {/* Cerrar dropdowns al hacer click fuera */}
      {(isProfileOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}

      {/* Estilos CSS para animaciones */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Navbar;