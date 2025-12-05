import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import type { Usuario } from '../../types';

interface EstadisticasUsuario {
  totalAccesos: number;
  accesosActivos: number;
  accesosHoy: number;
  ratioCompletitud: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    fetchPerfil();
    fetchEstadisticas();
  }, []);

  const fetchPerfil = async () => {
    try {
      const response = await api.get('/perfil/mi-perfil');
      setUsuario(response.data);
    } catch (error) {
      console.error('Error fetching perfil:', error);
      alert('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const fetchEstadisticas = async () => {
    try {
      const response = await api.get('/perfil/estadisticas');
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error fetching estadísticas:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleEditarPerfil = () => {
    navigate('/perfil/update');
  };

  const getRolDisplay = (rol: string) => {
    const roles: { [key: string]: string } = {
      SUPERADMIN: 'Super Administrador',
      ADMINISTRADOR: 'Administrador',
      SUPERVISOR: 'Supervisor',
      OPERATIVO: 'Operativo'
    };
    return roles[rol] || rol;
  };

  const getRolColor = (rol: string) => {
    const colors: { [key: string]: string } = {
      SUPERADMIN: 'from-purple-500 via-purple-600 to-purple-700',
      ADMINISTRADOR: 'from-red-500 via-red-600 to-red-700',
      SUPERVISOR: 'from-orange-500 via-orange-600 to-amber-600',
      OPERATIVO: 'from-blue-500 via-blue-600 to-cyan-600'
    };
    return colors[rol] || 'from-gray-500 to-gray-600';
  };

  const getRolIcon = (rol: string) => {
    const icons: { [key: string]: string } = {
      SUPERADMIN: '👑',
      ADMINISTRADOR: '⚡',
      SUPERVISOR: '🎯',
      OPERATIVO: '🛡️'
    };
    return icons[rol] || '👤';
  };

  const getStatusGlow = (activo: boolean) => {
    return activo ? 'shadow-lg shadow-green-500/25' : 'shadow-lg shadow-red-500/25';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white text-lg font-light">Cargando tu perfil...</div>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4 animate-pulse">⚡</div>
          <div className="text-white font-bold text-xl mb-4">Error al cargar el perfil</div>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition duration-300 font-medium backdrop-blur-sm border border-white/10"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 py-6">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Compacto */}
        <div className={`relative rounded-2xl p-6 mb-8 bg-gradient-to-r ${getRolColor(usuario.rol)} text-white shadow-xl overflow-hidden`}>
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-xl border border-white/10 shadow-xl">
                  <span className="text-4xl filter drop-shadow-lg">{getRolIcon(usuario.rol)}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2 tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    {usuario.nombre} {usuario.apellidos}
                  </h1>
                  <p className="text-white/80 text-base mb-4 font-light">{usuario.email}</p>
                  <div className="flex items-center space-x-3">
                    <span className="bg-white/20 px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-sm border border-white/10 shadow-lg">
                      {getRolDisplay(usuario.rol)}
                    </span>
                    <span className={`px-4 py-2 rounded-xl text-sm font-semibold backdrop-blur-sm border border-white/10 ${getStatusGlow(usuario.estaActivo)} ${
                      usuario.estaActivo ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
                    }`}>
                      {usuario.estaActivo ? '🟢 ACTIVA' : '🔴 INACTIVA'}
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleEditarPerfil}
                className="mt-6 lg:mt-0 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl duration-300 font-semibold flex items-center space-x-2 backdrop-blur-xl border border-white/10 shadow-xl hover:scale-105 transform transition-transform"
              >
                <span className="text-xl">✨</span>
                <span className="text-base">EDITAR PERFIL</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Información Personal - Tarjeta Compacta */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6 hover:bg-white/10 transition duration-500">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-blue-400 to-cyan-400 p-3 rounded-xl shadow-lg">
                  <span className="text-2xl">👑</span>
                </div>
                <h2 className="text-xl font-bold text-white">Información Personal</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-white/60 uppercase tracking-widest">Nombre</label>
                  <p className="text-white text-lg font-semibold">
                    {usuario.nombre}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-white/60 uppercase tracking-widest">Apellidos</label>
                  <p className="text-white text-lg font-semibold">
                    {usuario.apellidos}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-white/60 uppercase tracking-widest">Email</label>
                  <div className="flex items-center space-x-2">
                    <p className="text-white text-base">{usuario.email}</p>
                    <span className="text-green-400 text-base animate-pulse">✓</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-white/60 uppercase tracking-widest">Teléfono</label>
                  <p className="text-white text-base">
                    {usuario.telefono || (
                      <span className="text-white/40 italic">No especificado</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Información de la Cuenta - Tarjeta Compacta */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6 hover:bg-white/10 transition duration-500">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-green-400 to-emerald-400 p-3 rounded-xl shadow-lg">
                  <span className="text-2xl">⚡</span>
                </div>
                <h2 className="text-xl font-bold text-white">Detalles de la Cuenta</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-white/60 uppercase tracking-widest">Miembro desde</label>
                  <p className="text-white text-base font-semibold">
                    {new Date(usuario.fechaCreacion).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                {usuario.fechaActualizacion && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-white/60 uppercase tracking-widest">Última actualización</label>
                    <p className="text-white text-base">
                      {new Date(usuario.fechaActualizacion).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-white/60 uppercase tracking-widest">Estado</label>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full animate-pulse ${usuario.estaActivo ? 'bg-green-400 shadow-lg shadow-green-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'}`}></div>
                    <span className={`text-base font-semibold ${usuario.estaActivo ? 'text-green-400' : 'text-red-400'}`}>
                      {usuario.estaActivo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-white/60 uppercase tracking-widest">Nivel de Acceso</label>
                  <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r ${getRolColor(usuario.rol)} text-white shadow-xl`}>
                    {getRolDisplay(usuario.rol)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas - Solo para OPERATIVO y SUPERVISOR */}
          {(usuario?.rol !== 'SUPERADMIN' && usuario?.rol !== 'ADMINISTRADOR') && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6 hover:bg-white/10 transition duration-500">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-3 rounded-xl shadow-lg">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">Mis Logros</h2>
                </div>

                {loadingStats ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse bg-white/10 rounded-xl h-16"></div>
                    ))}
                  </div>
                ) : estadisticas ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-xl p-4 border border-blue-400/20 shadow-xl hover:scale-105 transform transition duration-300">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{estadisticas.totalAccesos}</div>
                          <div className="text-blue-200 text-xs font-medium">TOTAL DE ACCESOS</div>
                        </div>
                        <div className="text-2xl text-blue-300">🏆</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-xl p-4 border border-green-400/20 shadow-xl hover:scale-105 transform transition duration-300">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{estadisticas.accesosHoy}</div>
                          <div className="text-green-200 text-xs font-medium">ACCESOS HOY</div>
                        </div>
                        <div className="text-2xl text-green-300">🎯</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 backdrop-blur-lg rounded-xl p-4 border border-orange-400/20 shadow-xl hover:scale-105 transform transition duration-300">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{estadisticas.accesosActivos}</div>
                          <div className="text-orange-200 text-xs font-medium">ACTIVOS AHORA</div>
                        </div>
                        <div className="text-2xl text-orange-300">🔥</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl p-4 border border-purple-400/20 shadow-xl hover:scale-105 transform transition duration-300">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-2xl font-bold text-white">{estadisticas.ratioCompletitud}</div>
                          <div className="text-purple-200 text-xs font-medium">EFICIENCIA</div>
                        </div>
                        <div className="text-2xl text-purple-300">📈</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-white/40 text-6xl mb-4">📊</div>
                    <p className="text-white/60 text-sm">No se pudieron cargar las estadísticas</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Para ADMIN y SUPERADMIN - Espacio decorativo compacto */}
          {(usuario?.rol === 'SUPERADMIN' || usuario?.rol === 'ADMINISTRADOR') && (
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6 text-center">
                <div className="text-6xl mb-4">👑</div>
                <h3 className="text-lg font-bold text-white mb-2">MODO ADMINISTRADOR</h3>
                <p className="text-white/60 text-sm">
                  Tienes acceso completo al sistema
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-4 border border-emerald-400/20 shadow-xl text-center">
                <div className="text-4xl mb-2">⚡</div>
                <h3 className="text-base font-bold text-emerald-300 mb-1">PODER TOTAL</h3>
                <p className="text-emerald-200/80 text-xs">Control completo sobre usuarios</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Decorativo Compacto */}
        <div className="text-center mt-8">
          <p className="text-white/40 text-xs">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;