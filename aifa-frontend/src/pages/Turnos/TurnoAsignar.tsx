import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { Turno, Usuario, UpdateTurnoDto } from '../../types';
import type { Filtro } from '../../types';
import Swal from 'sweetalert2';

const TurnoAsignar: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [turno, setTurno] = useState<Turno | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtros, setFiltros] = useState<Filtro[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [userFiltros, setUserFiltros] = useState<{ [key: number]: number | null }>({});
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nombreTurno: '',
    horaInicio: '',
    horaFin: ''
  });

  const isAdmin = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'SUPERADMIN';

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [turnoRes, usuariosRes, filtrosRes, turnosActivosRes] = await Promise.all([
        api.get(`/turnos/${id}`),
        api.get('/usuarios'),
        api.get('/filtros/activos'),
        api.get('/turnos/activos')
      ]);

      setTurno(turnoRes.data);
      setEditData({
        nombreTurno: turnoRes.data.nombreTurno,
        horaInicio: new Date(turnoRes.data.horaInicio).toISOString().slice(11, 16),
        horaFin: turnoRes.data.horaFin ? new Date(turnoRes.data.horaFin).toISOString().slice(11, 16) : ''
      });

      // Obtener IDs de usuarios que ya están en otros turnos activos (excluyendo el turno actual)
      const usuariosEnOtrosTurnos = new Set<number>();
      turnosActivosRes.data.forEach((turnoActivo: Turno) => {
        if (turnoActivo.id !== Number(id)) {
          turnoActivo.usuarios?.forEach((tu: any) => {
            usuariosEnOtrosTurnos.add(tu.usuarioId);
          });
        }
      });

      // Filtrar solo usuarios activos con rol SUPERVISOR u OPERATIVO que NO estén en otros turnos activos
      const usuariosDisponibles = usuariosRes.data.filter((u: Usuario) =>
        u.estaActivo &&
        (u.rol === 'SUPERVISOR' || u.rol === 'OPERATIVO') &&
        !usuariosEnOtrosTurnos.has(u.id)
      );

      setUsuarios(usuariosDisponibles);
      setFiltros(filtrosRes.data);

      // Pre-seleccionar usuarios ya asignados al turno
      const usuariosAsignados = turnoRes.data.usuarios?.map((tu: any) => tu.usuarioId) || [];
      setSelectedUsers(usuariosAsignados);

      // Cargar los Controles de acceso asignados desde los datos de los usuarios
      const filtrosIniciales: { [key: number]: number | null } = {};

      usuariosAsignados.forEach((userId: number) => {
        const usuario = usuariosRes.data.find((u: Usuario) => u.id === userId);
        if (usuario && usuario.filtroAsignado) {
          filtrosIniciales[userId] = usuario.filtroAsignado.id;
        } else {
          filtrosIniciales[userId] = null;
        }
      });

      setUserFiltros(filtrosIniciales);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para limpiar Control de acceso de un usuario
  const limpiarFiltroUsuario = async (usuarioId: number) => {
    try {
      await api.put(`/usuarios/${usuarioId}`, {
        filtroAsignadoId: null
      });
    } catch (error) {
      console.error(`Error eliminando Control de acceso del usuario ${usuarioId}:`, error);
      throw error;
    }
  };

  const handleAsignar = async () => {
    const result = await Swal.fire({
      title: `¿Gestionar Turno?`,
      text: '¿Está seguro de actualizar las asignaciones de este turno?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: "Sí, actualizar",
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'alert' }
    });
    if (result.isConfirmed) {
      setSaving(true);
      try {
        // 1. Primero asignar usuarios al turno
        await api.patch(`/turnos/${id}/asignar`, {
          usuarioIds: selectedUsers
        });

        // 2. Luego actualizar los Controles de acceso de cada usuario
        const updatePromises = selectedUsers.map(userId => {
          const filtroId = userFiltros[userId];
          return api.put(`/usuarios/${userId}`, {
            filtroAsignadoId: filtroId || null
          });
        });

        await Promise.all(updatePromises);

        Swal.fire({
          icon: "success",
          text: "Asignaciones actualizadas exitosamente",
          title: "Aviso",
          timer: 2000,
          timerProgressBar: true,
          customClass: { popup: "alert" }
        });
        fetchData();
        navigate("/turnos")
      } catch (error) {
        console.error('Error asignando usuarios al turno:', error);
        alert('Error al actualizar las asignaciones');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDesasignarTodos = async () => {
    const result = await Swal.fire({
      title: `¿Gestionar Turno?`,
      text: '¿Está seguro de desasignar TODOS los usuarios de este turno? También se eliminarán sus Controles de acceso asignados.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: "Sí, desasignar",
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'alert' }
    });
    if (result.isConfirmed) {
      try {
        // 1. Primero limpiar los Controles de acceso de todos los usuarios seleccionados
        const limpiarFiltrosPromises = selectedUsers.map(userId =>
          limpiarFiltroUsuario(userId)
        );
        await Promise.all(limpiarFiltrosPromises);

        // 2. Luego desasignar del turno
        await api.patch(`/turnos/${id}/desasignarall`, {
          usuarioIds: selectedUsers
        });

        setSelectedUsers([]);
        setUserFiltros({});
        Swal.fire({
          icon: "success",
          text: "Todos los usuarios han sido desasignados y sus Controles de acceso eliminados",
          title: "Aviso",
          timer: 2000,
          timerProgressBar: true,
          customClass: { popup: "alert" }
        });
        fetchData();
      } catch (error) {
        console.error('Error desasignando usuarios:', error);
        alert('Error al desasignar usuarios');
      }
    }
  };

  const handleDesasignarUsuario = async (usuarioId: number) => {
    const usuario = usuarios.find(u => u.id === usuarioId);
    if (!usuario) return;

    const result = await Swal.fire({
      title: `¿Gestionar Turno?`,
      text: `¿Está seguro de desasignar a ${usuario.nombre} ${usuario.apellidos} de este turno? También se eliminará su Control de acceso asignado.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: "Sí, desasignar",
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'alert' }
    });

    if (result.isConfirmed) {
      try {
        // 1. Primero limpiar el Control de acceso del usuario
        await limpiarFiltroUsuario(usuarioId);

        // 2. Luego desasignar del turno
        await api.delete(`/turnos/${id}/desasignar`, {
          params: { usuarioId }
        });

        // Actualizar el estado local inmediatamente
        setSelectedUsers(prev => prev.filter(id => id !== usuarioId));

        // Remover el Control de acceso del usuario desasignado
        setUserFiltros(prev => {
          const newFiltros = { ...prev };
          delete newFiltros[usuarioId];
          return newFiltros;
        });

        Swal.fire({
          icon: "success",
          text: "Usuario desasignado y Control de acceso eliminado exitosamente",
          title: "Aviso",
          timer: 2000,
          timerProgressBar: true,
          customClass: { popup: "alert" }
        });
        fetchData();
      } catch (error: any) {
        if (error.response?.data?.error) {
          Swal.fire({
            icon: "error",
            text: `Error: ${error.response.data.error}`,
            title: "Aviso",
            timer: 2000,
            timerProgressBar: true,
            customClass: { popup: "alert" }
          });
        } else {
          Swal.fire({
            icon: "error",
            text: "Error al desasignar usuario. Verifique la conexión",
            title: "Aviso",
            timer: 2000,
            timerProgressBar: true,
            customClass: { popup: "alert" }
          });
        }
      }
    }
  };

  const handleFiltroChange = (usuarioId: number, filtroId: number | null) => {
    setUserFiltros(prev => ({
      ...prev,
      [usuarioId]: filtroId
    }));
  };

  const handleUserSelection = (userId: number) => {
    const isCurrentlySelected = selectedUsers.includes(userId);
    const usuario = usuarios.find(u => u.id === userId);

    if (isCurrentlySelected) {
      // Deseleccionar usuario
      setSelectedUsers(prev => prev.filter(id => id !== userId));
      setUserFiltros(prev => {
        const newFiltros = { ...prev };
        delete newFiltros[userId];
        return newFiltros;
      });
    } else {
      // Seleccionar usuario
      setSelectedUsers(prev => [...prev, userId]);
      // Inicializar con el filtro actual del usuario si ya tiene uno asignado
      setUserFiltros(prev => ({
        ...prev,
        [userId]: usuario?.filtroAsignado?.id || null
      }));
    }
  };

  const handleCerrarTurno = async () => {
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
        fetchData();
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
        alert('Error al cerrar el turno');
      }
    }
  };

  const handleEliminarTurno = async () => {
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
        await api.delete(`/turnos/delete/${id}/`);
        Swal.fire({
          icon: "success",
          text: "Turno eliminado exitosamente",
          title: "Aviso",
          timer: 2000,
          timerProgressBar: true,
          customClass: { popup: "alert" }
        });
        navigate('/turnos');
      } catch (error) {
        console.error('Error eliminando turno:', error);
        alert('Error al eliminar el turno');
      }
    }
  };

  const handleEditarTurno = async () => {
    if (!editData.nombreTurno.trim()) {
      alert('El nombre del turno es requerido');
      return;
    }

    const updateData: UpdateTurnoDto = {
      nombreTurno: editData.nombreTurno
    };

    if (editData.horaInicio) {
      const horaInicio = new Date();
      const [hours, minutes] = editData.horaInicio.split(':').map(Number);
      horaInicio.setHours(hours, minutes, 0, 0);
      updateData.horaInicio = horaInicio;
    }

    if (editData.horaFin) {
      const horaFin = new Date();
      const [hours, minutes] = editData.horaFin.split(':').map(Number);
      horaFin.setHours(hours, minutes, 0, 0);
      updateData.horaFin = horaFin;
    }

    try {
      await api.put(`/turnos/${id}`, updateData);
      setIsEditing(false);
      fetchData();
      Swal.fire({
        icon: "success",
        text: "Turno actualizado exitosamente",
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });
    } catch (error) {
      console.error('Error editando turno:', error);
      alert('Error al actualizar el turno');
    }
  };

  const getRolBadge = (rol: string) => {
    const roles = {
      'SUPERVISOR': 'bg-orange-100 text-orange-800 border-orange-200',
      'OPERATIVO': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return roles[rol as keyof typeof roles] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const toggleSelect = () => {
    setIsSelectOpen(!isSelectOpen);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toTimeString().slice(0, 5);
  };

  const getFiltroNombre = (filtroId: number | null) => {
    if (!filtroId) return 'Sin Control de acceso asignado';
    const filtro = filtros.find(f => f.id === filtroId);
    return filtro ? filtro.nombre : 'Control de acceso no encontrado';
  };

  const getUsuarioFiltroNombre = (usuario: Usuario) => {
    return usuario.filtroAsignado ? usuario.filtroAsignado.nombre : 'Sin Control de acceso asignado';
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;
  }

  if (!turno) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Turno no encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          {/* Header con acciones */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">👥 Gestionar Turno</h1>
                <p className="text-gray-600 text-sm sm:text-base">Gestione el personal asignado al turno "{turno.nombreTurno}"</p>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-wrap gap-2">
                {isAdmin && turno.estaActivo && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 sm:px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                  >
                    {isEditing ? 'Cancelar' : '✏️ Editar'}
                  </button>
                )}

                {isAdmin && turno.estaActivo && (
                  <button
                    onClick={handleCerrarTurno}
                    className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm"
                  >
                    🔒 Cerrar
                  </button>
                )}

                {isAdmin && !turno.estaActivo && (
                  <button
                    onClick={handleEliminarTurno}
                    className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                  >
                    🗑️ Eliminar
                  </button>
                )}
              </div>
            </div>

            {/* Estado del turno */}
            <div className="mt-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${turno.estaActivo
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
                }`}>
                {turno.estaActivo ? '🟢 ACTIVO' : '🔒 CERRADO'}
              </span>
              {!turno.estaActivo && (
                <span className="ml-2 text-sm text-gray-600">
                  Cerrado el {new Date(turno.fechaActualizacion).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Información del Turno Actual - Editable si está en modo edición */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              {isEditing ? 'Editar Información del Turno' : 'Información del Turno'}
            </h3>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Turno *
                  </label>
                  <input
                    type="text"
                    value={editData.nombreTurno}
                    onChange={(e) => setEditData({ ...editData, nombreTurno: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora de Inicio
                    </label>
                    <input
                      type="time"
                      value={editData.horaInicio}
                      onChange={(e) => setEditData({ ...editData, horaInicio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora de Fin
                    </label>
                    <input
                      type="time"
                      value={editData.horaFin}
                      onChange={(e) => setEditData({ ...editData, horaFin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm sm:text-base">
                <div><strong>Turno:</strong> {turno.nombreTurno}</div>
                <div><strong>Estado:</strong> {turno.estaActivo ? 'Activo' : 'Cerrado'}</div>
                <div><strong>Inicio:</strong> {formatTime(turno.horaInicio)}</div>
                <div><strong>Fin:</strong> {turno.horaFin ? formatTime(turno.horaFin) : 'No definido'}</div>
                <div><strong>Creado por:</strong> {turno.creador?.nombre} {turno.creador?.apellidos}</div>
                <div><strong>Accesos registrados:</strong> {turno.accesos?.length || 0}</div>
                <div className="sm:col-span-2"><strong>Personal asignado:</strong> {turno.usuarios?.length || 0} usuarios</div>
              </div>
            )}
          </div>

          {/* Selección de Usuarios y Controles de acceso - Solo disponible para admins y turnos activos */}
          {isAdmin && turno.estaActivo && (
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-green-900 mb-3">Asignar Personal y Control de acceso</h3>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Personal Asignado ({selectedUsers.length})
                  </label>
                  {selectedUsers.length > 0 && (
                    <button
                      onClick={handleDesasignarTodos}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium w-full sm:w-auto"
                    >
                      🗑️ Desasignar Todos
                    </button>
                  )}
                </div>

                {/* Select Desplegable Personalizado */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-left flex justify-between items-center text-sm sm:text-base"
                  >
                    <span className="text-gray-700">
                      {selectedUsers.length > 0
                        ? `${selectedUsers.length} usuario(s) seleccionado(s)`
                        : 'Seleccione el personal'
                      }
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transform transition-transform ${isSelectOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Lista Desplegable */}
                  {isSelectOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {usuarios.map(usuario => (
                          <div
                            key={usuario.id}
                            className="flex items-center p-2 hover:bg-blue-50 rounded-lg cursor-pointer"
                            onClick={() => handleUserSelection(usuario.id)}
                          >
                            <div className={`w-4 h-4 border rounded mr-3 flex items-center justify-center ${selectedUsers.includes(usuario.id)
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                              }`}>
                              {selectedUsers.includes(usuario.id) && (
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {usuario.nombre} {usuario.apellidos}
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                <span className="text-sm text-gray-500 truncate">{usuario.email}</span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRolBadge(usuario.rol)}`}>
                                  {usuario.rol}
                                </span>
                              </div>
                              {usuario.filtroAsignado && (
                                <div className="text-xs text-green-600 mt-1 truncate">
                                  Control de acceso actual: {getUsuarioFiltroNombre(usuario)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Usuarios Seleccionados con opción de asignar Control de acceso y desasignar individual */}
                {selectedUsers.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-700 font-medium mb-2">
                      Usuarios seleccionados:
                    </div>
                    <div className="space-y-3">
                      {usuarios
                        .filter(u => selectedUsers.includes(u.id))
                        .map(usuario => (
                          <div key={usuario.id} className="bg-white p-3 rounded border">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-base sm:text-lg">
                                  {usuario.nombre} {usuario.apellidos}
                                </div>
                                <div className="text-gray-500 text-sm">{usuario.email}</div>
                                {usuario.filtroAsignado && (
                                  <div className="text-xs text-green-600">
                                    Control de acceso actual del usuario: {getUsuarioFiltroNombre(usuario)}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRolBadge(usuario.rol)}`}>
                                  {usuario.rol}
                                </span>
                                <button
                                  onClick={() => handleDesasignarUsuario(usuario.id)}
                                  className="text-red-500 hover:text-red-700 text-sm p-1 rounded hover:bg-red-50"
                                  title="Desasignar usuario"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>

                            {/* Selector de Filtro para el usuario */}
                            <div className="mt-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Asignar Nuevo Control de acceso:
                              </label>
                              <select
                                value={userFiltros[usuario.id] || ''}
                                onChange={(e) => handleFiltroChange(usuario.id, e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              >
                                <option value="">Sin Control de acceso asignado</option>
                                {filtros.map(filtro => (
                                  <option key={filtro.id} value={filtro.id}>
                                    {filtro.nombre} {filtro.ubicacion ? `- ${filtro.ubicacion}` : ''}
                                  </option>
                                ))}
                              </select>
                              <div className="text-xs text-gray-500 mt-1">
                                Filtro seleccionado: {getFiltroNombre(userFiltros[usuario.id])}
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="flex items-start">
                    <div className="text-yellow-600 mr-2 mt-0.5">💡</div>
                    <div className="text-sm text-yellow-800">
                      <strong>Nota:</strong> Seleccione usuarios, asigne un Control de acceso a cada uno y luego haga clic en "Confirmar Asignación" para guardar los cambios.
                      Los Controles de acceso asignados determinarán qué accesos puede gestionar cada usuario.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions - BOTONES UNIFICADOS HASTA ABAJO */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/turnos')}
              className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base order-2 sm:order-1"
            >
              Volver a Turnos
            </button>

            {/* Botones de edición (solo se muestran cuando está en modo edición) */}
            {isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base order-3 sm:order-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEditarTurno}
                  className="px-4 sm:px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm sm:text-base order-1 sm:order-3"
                >
                  Guardar Cambios
                </button>
              </>
            )}

            {/* Botón de confirmar asignación (solo para admins y turnos activos) */}
            {isAdmin && turno.estaActivo && !isEditing && (
              <button
                onClick={handleAsignar}
                disabled={saving}
                className="px-4 sm:px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm sm:text-base font-medium order-1 sm:order-2"
              >
                {saving ? 'Guardando...' : 'Confirmar Asignación'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cerrar dropdown al hacer click fuera */}
      {isSelectOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsSelectOpen(false)}
        />
      )}
    </div>
  );
};

export default TurnoAsignar;