import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { Usuario, Rol } from '../../types';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Swal from 'sweetalert2';

interface UsuarioConBloqueo extends Usuario {
  intentosFallidos?: number;
  bloqueadoHasta?: string | null;
  bloqueado?: boolean;
  lockedUntil?: string | null;
  failedAttempts?: number;
  ultimoAcceso?: string | null;
}

const UsuarioList: React.FC = () => {
  const { usuario: currentUser } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioConBloqueo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Rol | 'todos'>('todos');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const estaBloqueado = (user: UsuarioConBloqueo): boolean => {
    if (user.bloqueadoHasta) {
      const bloqueadoHasta = new Date(user.bloqueadoHasta);
      const ahora = new Date();
      return bloqueadoHasta > ahora;
    }

    if (user.lockedUntil) {
      const lockedUntil = new Date(user.lockedUntil);
      const ahora = new Date();
      return lockedUntil > ahora;
    }

    if (typeof user.bloqueado === 'boolean') {
      return user.bloqueado;
    }

    const intentos = user.intentosFallidos || user.failedAttempts || 0;
    if (intentos >= 3) {
      return true;
    }

    return false;
  };

  const handleDesbloquear = async (id: number, email: string) => {
    const result = await Swal.fire({
      title: `¿Gestionar Usuario?`,
      text: `¿Estás seguro de desbloquear la cuenta de ${email}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: "Sí, desbloquear",
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'alert' }
    });
    if (result.isConfirmed) {
      try {
        try {
          await api.patch(`/login/desbloquear/${id}`);
        } catch (routeError) {
          await api.put(`/usuarios/${id}`, {
            bloqueadoHasta: null,
            intentosFallidos: 0
          });
        }

        await fetchUsuarios();
        Swal.fire({
            icon: "success",
            text: `${email} desbloqueado exitosamente`,
            title: "Aviso",
            timer: 2000,
            timerProgressBar: true,
            customClass: { popup: "alert" }
          });
      } catch (error: any) {
        console.error('Error desbloqueando usuario:', error);
        if (error.response?.data?.error) {
          alert(`Error: ${error.response.data.error}`);
        } else {
          alert('Error al desbloquear el usuario');
        }
      }
    }
  };

  const navigateToCrearUsuario = () => navigate('/usuarios/crear');
  const navigateToEditarUsuario = (id: number) => navigate(`/usuarios/editar/${id}`);

  const handleDelete = async (id: number, nombre: string) => {
    const result = await Swal.fire({
      title: `¿Gestionar usuario?`,
      text: `¿Estás seguro de eliminar a ${nombre}?`,
      icon: 'warning',
      footer: 'Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'alert' }
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/usuarios/delete/${id}`);
        setUsuarios(usuarios.filter(u => u.id !== id));
        await Swal.fire({
        title: '¡Éxito!',
        text: `Usuario eliminado correctamente`,
        icon: 'success',
        confirmButtonColor: '#10b981',
        timer: 1500,
        timerProgressBar: true,
        customClass: { popup: 'alert' }
      });
      } catch (error) {
        console.error('Error deleting usuario:', error);
      }
    }
  };

  const handleStatusChange = async (id: number, estaActivo: boolean, nombre: string) => {
    const nuevoEstado = !estaActivo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    const accionPasado = nuevoEstado ? 'activado' : 'desactivado';

    const result = await Swal.fire({
      title: `${accion.charAt(0).toUpperCase() + accion.slice(1)} Usuario`,
      text: `¿Estás seguro de ${accion} al usuario "${nombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'alert' }
    });

    if (!result.isConfirmed) return;

    try {
      await api.put(`/usuarios/${id}`, { estaActivo: nuevoEstado });
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, estaActivo: nuevoEstado } : u));

      await Swal.fire({
        title: '¡Éxito!',
        text: `Usuario ${accionPasado} correctamente`,
        icon: 'success',
        confirmButtonColor: '#10b981',
        timer: 1500,
        timerProgressBar: true,
        customClass: { popup: 'alert' }
      });
    } catch (error) {
      console.error('Error updating usuario status:', error);

      await Swal.fire({
        title: 'Error',
        text: `No se pudo ${accion} el usuario`,
        icon: 'error',
        confirmButtonColor: '#ef4444',
        customClass: { popup: 'alert' }
      });
    }
  };

  const filteredUsuarios = usuarios.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.rol.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'todos' || user.rol === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (rol: Rol) => {
    switch (rol) {
      case 'SUPERADMIN': return 'bg-purple-100 text-purple-800';
      case 'ADMINISTRADOR': return 'bg-green-100 text-green-800';
      case 'SUPERVISOR': return 'bg-orange-100 text-orange-800';
      case 'OPERATIVO': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canEditUser = (targetUser: UsuarioConBloqueo) => {
    if (!currentUser) return false;
    if (estaBloqueado(targetUser)) return false;

    if (currentUser.rol === 'SUPERADMIN') {
      return targetUser.id !== currentUser.id;
    }

    if (currentUser.rol === 'ADMINISTRADOR') {
      return (targetUser.rol === 'OPERATIVO' || targetUser.rol === 'SUPERVISOR') &&
        targetUser.id !== currentUser.id;
    }

    return false;
  };

  const canDeleteUser = (targetUser: UsuarioConBloqueo) => {
    if (!currentUser) return false;
    if (estaBloqueado(targetUser)) return false;

    if (currentUser.rol === 'SUPERADMIN') {
      return targetUser.id !== currentUser.id;
    }

    return false;
  };

  const canDesbloquearUser = (targetUser: UsuarioConBloqueo) => {
    if (!currentUser) return false;

    if (!['SUPERADMIN', 'ADMINISTRADOR'].includes(currentUser.rol)) {
      return false;
    }

    if (targetUser.id === currentUser.id) {
      return false;
    }

    return estaBloqueado(targetUser);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Cargando usuarios...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">👥 Gestión de Usuarios</h1>
              <p className="text-gray-600">Administra los usuarios del sistema</p>
            </div>
            <button onClick={navigateToCrearUsuario} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">
              + Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nombre, apellidos, email o rol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as Rol | 'todos')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos los roles</option>
              <option value="OPERATIVO">Operativo</option>
              <option value="SUPERVISOR">Supervisor</option>
              {currentUser?.rol === 'ADMINISTRADOR' || currentUser?.rol === 'SUPERADMIN' ? (
                <option value="ADMINISTRADOR">Administrador</option>
              ) : null}
              {currentUser?.rol === 'SUPERADMIN' && (
                <option value="SUPERADMIN">Superadmin</option>
              )}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsuarios.map((user) => {
                  const isCurrentUser = user.id === currentUser?.id;
                  const usuarioBloqueado = estaBloqueado(user);

                  return (
                    <tr key={user.id} className={`hover:bg-gray-50 ${isCurrentUser ? 'bg-blue-50' : ''} ${usuarioBloqueado ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${usuarioBloqueado ? 'bg-red-500' : 'bg-blue-500'
                            }`}>
                            <span className="text-white font-semibold">
                              {user.nombre.charAt(0)}{user.apellidos.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {user.nombre} {user.apellidos}
                              {isCurrentUser && (
                                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Tú</span>
                              )}
                              {usuarioBloqueado && (
                                <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">🔒 Bloqueado</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.telefono || 'Sin teléfono'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.rol)}`}>
                          {user.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.estaActivo
                          ? usuarioBloqueado
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {user.estaActivo
                            ? usuarioBloqueado ? 'Activo 🔒' : 'Activo'
                            : 'Inactivo'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.fechaCreacion).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigateToEditarUsuario(user.id)}
                            disabled={!canEditUser(user) || usuarioBloqueado}
                            className={`${canEditUser(user) && !usuarioBloqueado ? 'text-blue-600 hover:text-blue-900' : 'text-gray-400 cursor-not-allowed'}`}
                            title={usuarioBloqueado ? 'Desbloquea al usuario primero' : ''}
                          >
                            Editar
                          </button>

                          {canEditUser(user) && (
                            <button
                              onClick={() => handleStatusChange(user.id, user.estaActivo, user.nombre)}
                              disabled={usuarioBloqueado}
                              className={`${usuarioBloqueado
                                ? 'text-gray-400 cursor-not-allowed'
                                : user.estaActivo
                                  ? 'text-orange-600 hover:text-orange-900'
                                  : 'text-green-600 hover:text-green-900'
                                }`}
                              title={usuarioBloqueado ? 'Desbloquea al usuario primero' : ''}
                            >
                              {user.estaActivo ? 'Desactivar' : 'Activar'}
                            </button>
                          )}

                          {canDesbloquearUser(user) && (
                            <button
                              onClick={() => handleDesbloquear(user.id, user.email)}
                              className="text-green-600 hover:text-green-900 font-medium"
                              title="Desbloquear cuenta"
                            >
                              Desbloquear
                            </button>
                          )}

                          {canDeleteUser(user) && (
                            <button
                              onClick={() => handleDelete(user.id, user.nombre)}
                              disabled={usuarioBloqueado}
                              className={`${usuarioBloqueado
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-900'
                                }`}
                              title={usuarioBloqueado ? 'Desbloquea al usuario primero' : ''}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-3 border-t border-gray-200 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {filteredUsuarios.length} de {usuarios.length} usuarios
            </div>
            <div className="text-sm text-gray-600">
              {currentUser?.rol === 'ADMINISTRADOR' &&
                'Puedes gestionar solo Operativos y Supervisores'}
              {currentUser?.rol === 'SUPERADMIN' &&
                'Tienes acceso completo a todos los usuarios'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsuarioList;