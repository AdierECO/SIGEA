import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { Turno, Usuario } from '../../types';
import Navbar from '../../components/Navbar';
import Swal from 'sweetalert2';

const TurnoList: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');

  useEffect(() => {
    fetchTurnos();
    fetchUsuarios();
  }, []);

  const fetchTurnos = async () => {
    try {
      const response = await api.get('/turnos');
      setTurnos(response.data);
    } catch (error) {
      console.error('Error fetching turnos:', error);
    }
  };

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

  // Función para obtener usuario con Control de acceso asignado
  const getUsuarioConFiltro = (usuarioId: number) => {
    return usuarios.find(u => u.id === usuarioId);
  };

  const handleCerrarTurno = async (id: number) => {
    const result = await Swal.fire({
      title: `¿Gestionar Turno?`,
      text: '¿Está seguro de cerrar este turno?',
      icon: 'warning',
      footer: 'Esta acción no se puede deshacer.',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: "Sí, cerrar",
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'alert' }
    });
    if (result.isConfirmed) {
      try {
        await api.put(`/turnos/${id}`, {
          horaFin: new Date(),
          estaActivo: false
        });
        fetchTurnos();
        Swal.fire({
          icon: "success",
          text: "Turno cerrado exitosamente",
          title: "Aviso",
          timer: 2000,
          timerProgressBar: true,
          customClass: { popup: "alert" }
        });
      } catch (error) {
        console.error('Error cerrando turno:', error);
      }
    }
  };

  const handleEliminarTurno = async (id: number) => {
    const result = await Swal.fire({
      title: `¿Gestionar Turno?`,
      text: '¿Está seguro de ELIMINAR este turno?',
      icon: 'warning',
      footer: 'Esta acción es permanente y no se puede deshacer.',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'alert' }
    });
    if (result.isConfirmed) {
      try {
        await api.delete(`/turnos/delete/${id}`);
        Swal.fire({
          icon: "success",
          text: "Turno eliminado exitosamente",
          title: "Aviso",
          timer: 2000,
          timerProgressBar: true,
          customClass: { popup: "alert" }
        });
        fetchTurnos();
      } catch (error) {
        console.error('Error eliminando turno:', error);
        alert('Error al eliminar el turno. Asegúrese de que no tenga accesos asociados.');
      }
    }
  };

  const filteredTurnos = turnos.filter(turno => {
    if (filterEstado === 'todos') return true;
    if (filterEstado === 'activos') return turno.estaActivo;
    return !turno.estaActivo;
  });

  const getEstadoBadge = (turno: Turno) => {
    if (turno.estaActivo) {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">🟢 ACTIVO</span>;
    }
    return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">⚫ CERRADO</span>;
  };

  const getDuracionTurno = (turno: Turno) => {
    const inicio = new Date(turno.horaInicio);
    const fin = turno.horaFin ? new Date(turno.horaFin) : new Date();

    let diffMs = fin.getTime() - inicio.getTime();

    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000;
    }

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const getUsuariosAsignados = (turno: Turno) => {
    return turno.usuarios?.length || 0;
  };

  // Función para obtener usuarios con sus Controles de acceso asignados
  const getUsuariosConFiltro = (turno: Turno) => {
    if (!turno.usuarios || turno.usuarios.length === 0) return [];

    return turno.usuarios.map(turnoUsuario => {
      const usuarioCompleto = getUsuarioConFiltro(turnoUsuario.usuarioId);
      return {
        ...turnoUsuario,
        usuario: usuarioCompleto || turnoUsuario.usuario
      };
    });
  };

  // Contar usuarios con Control de acceso en un turno
  const contarUsuariosConFiltro = (turno: Turno) => {
    const usuariosConFiltro = getUsuariosConFiltro(turno).filter(tu =>
      tu.usuario?.filtroAsignado
    );
    return usuariosConFiltro.length;
  };

  // Verificar si el usuario es administrador
  const isAdmin = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'SUPERADMIN';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando turnos y usuarios...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🕐 Gestión de Turnos</h1>
              <p className="text-gray-600 text-sm sm:text-base">Control y administración de turnos de trabajo</p>
              {isAdmin && (
                <div className="mt-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Modo Administrador
                  </span>
                </div>
              )}
            </div>
            {isAdmin && (
              <button
                onClick={() => navigate('/turnos/crear')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg flex items-center justify-center text-sm sm:text-base"
              >
                <span className="mr-2">+</span> Nuevo Turno
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{turnos.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Turnos</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {turnos.filter(t => t.estaActivo).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Turnos Activos</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">
              {turnos.reduce((acc, turno) => acc + (turno.usuarios?.length || 0), 0)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Total Asignaciones</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {turnos.reduce((acc, turno) => acc + contarUsuariosConFiltro(turno), 0)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Usuarios con Control de acceso</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex gap-3 sm:gap-4">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as any)}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="todos">Todos los turnos</option>
              <option value="activos">Turnos activos</option>
              <option value="inactivos">Turnos cerrados</option>
            </select>
          </div>
        </div>

        {/* Turnos Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Turno
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creador
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horario
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duración
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Personal
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accesos
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTurnos.map((turno) => {
                  return (
                    <tr key={turno.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {turno.nombreTurno}
                        </div>
                        <div className="text-xs text-gray-500">ID: {turno.id}</div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {turno.creador?.nombre} {turno.creador?.apellidos}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          Inicio: {new Date(turno.horaInicio).toLocaleTimeString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(turno.horaInicio).toLocaleDateString()}
                        </div>
                        {turno.horaFin && (
                          <div className="text-xs text-green-600">
                            Fin: {new Date(turno.horaFin).toLocaleTimeString()}
                          </div>
                        )}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getDuracionTurno(turno)}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="text-sm text-gray-900 mb-2">
                          {getUsuariosAsignados(turno)} usuarios
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(turno)}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {turno.accesos?.length || 0} accesos
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1 sm:space-y-2">
                          {/* Ver - Disponible para todos */}
                          <button
                            onClick={() => navigate(`/turnos/ver/${turno.id}`)}
                            className="text-blue-600 hover:text-blue-900 text-xs bg-blue-50 px-2 py-1 rounded"
                          >
                            👁 Ver
                          </button>

                          {/* Acciones de Administrador */}
                          {isAdmin && (
                            <>
                              {/* Asignar - Solo turnos activos */}
                              {turno.estaActivo && (
                                <button
                                  onClick={() => navigate(`/turnos/${turno.id}/asignar`)}
                                  className="text-green-600 hover:text-green-900 text-xs bg-green-50 px-2 py-1 rounded"
                                >
                                  👥 Asignar
                                </button>
                              )}

                              {/* Cerrar - Solo turnos activos */}
                              {turno.estaActivo && (
                                <button
                                  onClick={() => handleCerrarTurno(turno.id)}
                                  className="text-red-600 hover:text-red-900 text-xs bg-red-50 px-2 py-1 rounded"
                                >
                                  🔒 Cerrar
                                </button>
                              )}

                              {/* Eliminar - Solo turnos cerrados */}
                              {!turno.estaActivo && (
                                <button
                                  onClick={() => handleEliminarTurno(turno.id)}
                                  className="text-red-600 hover:text-red-900 text-xs bg-red-50 px-2 py-1 rounded"
                                >
                                  🗑 Eliminar
                                </button>
                              )}
                            </>
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

        {filteredTurnos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron turnos con los filtros aplicados
          </div>
        )}

      </div>
    </div>
  );
};

export default TurnoList;