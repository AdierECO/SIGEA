import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import type { Turno, Usuario } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const TurnoView: React.FC = () => {
  const { usuario } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [turno, setTurno] = useState<Turno | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTurno();
    fetchUsuarios();
  }, [id]);

  const fetchTurno = async () => {
    try {
      const response = await api.get(`/turnos/${id}`);
      setTurno(response.data);
    } catch (error) {
      console.error('Error fetching turno:', error);
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

  // Función para obtener usuarios del turno con sus Controles de acceso asignados
  const getUsuariosConFiltro = () => {
    if (!turno?.usuarios || turno.usuarios.length === 0) return [];

    return turno.usuarios.map(turnoUsuario => {
      const usuarioCompleto = getUsuarioConFiltro(turnoUsuario.usuarioId);
      return {
        ...turnoUsuario,
        usuario: usuarioCompleto || turnoUsuario.usuario
      };
    });
  };

  const isAdmin = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'SUPERADMIN';

  const getDuracion = (turno: Turno) => {
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

  const getFiltroBadge = (usuario: any) => {
    if (!usuario.filtroAsignado) {
      return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">Sin Control de acceso asignado</span>;
    }
    return (
      <span
        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
        title={usuario.filtroAsignado.descripcion || usuario.filtroAsignado.ubicacion || ''}
      >
        {usuario.filtroAsignado.nombre}
        {usuario.filtroAsignado.ubicacion && ` (${usuario.filtroAsignado.ubicacion})`}
      </span>
    );
  };

  // Contar usuarios con Control de acceso en el turno
  const contarUsuariosConFiltro = () => {
    const usuariosConFiltro = getUsuariosConFiltro().filter(tu =>
      tu.usuario?.filtroAsignado
    );
    return usuariosConFiltro.length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando turno y usuarios...</div>
        </div>
      </div>
    );
  }

  if (!turno) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">Turno no encontrado</div>
          <button
            onClick={() => navigate('/turnos')}
            className="text-blue-600 hover:text-blue-800"
          >
            Volver a la lista de turnos
          </button>
        </div>
      </div>
    );
  }

  const usuariosConFiltro = getUsuariosConFiltro();

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🕐 Detalles del Turno</h1>
                <p className="text-gray-600 text-sm sm:text-base">Información completa del turno "{turno.nombreTurno}"</p>
              </div>
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${turno.estaActivo
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
                  }`}>
                  {turno.estaActivo ? 'ACTIVO' : 'CERRADO'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* Información Básica */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Información del Turno</h3>
              <div className="space-y-2 text-sm sm:text-base">
                <div><strong>Turno:</strong> {turno.nombreTurno}</div>
                <div><strong>ID:</strong> {turno.id}</div>
                <div><strong>Creado por:</strong> {turno.creador?.nombre} {turno.creador?.apellidos}</div>
                <div><strong>Estado:</strong> {turno.estaActivo ? 'Activo' : 'Cerrado'}</div>
              </div>
            </div>

            {/* Horario del Turno */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-3">⏰ Horario</h3>
              <div className="space-y-2 text-sm sm:text-base">
                <div><strong>Inicio:</strong> {new Date(turno.horaInicio).toLocaleString()}</div>
                <div><strong>Fin:</strong> {turno.horaFin ? new Date(turno.horaFin).toLocaleString() : 'En progreso'}</div>
                <div><strong>Duración:</strong> {getDuracion(turno)}</div>
              </div>
            </div>

            {/* Personal Asignado */}
            <div className="bg-purple-50 p-4 rounded-lg lg:col-span-2">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">
                👥 Personal Asignado ({usuariosConFiltro.length})
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span><strong>Total usuarios:</strong> {usuariosConFiltro.length}</span>
                </div>
                {usuariosConFiltro.length > 0 && (
                  <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                    {usuariosConFiltro.map(tu => (
                      <div key={tu.id} className="text-sm bg-white p-3 rounded border">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div className="flex-1">
                            <div className="font-medium">
                              {tu.usuario.nombre} {tu.usuario.apellidos}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              {tu.usuario.email} • {tu.usuario.rol}
                            </div>
                            {tu.usuario.telefono && (
                              <div className="text-gray-500 text-xs">
                                📞 {tu.usuario.telefono}
                              </div>
                            )}
                          </div>
                          <div className="text-right sm:text-left sm:ml-3">
                            {getFiltroBadge(tu.usuario)}
                            <div className="text-gray-400 text-xs mt-1">
                              {new Date(tu.fechaAsignacion).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {usuariosConFiltro.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No hay usuarios asignados a este turno
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-900 mb-3">📊 Estadísticas</h3>
              <div className="space-y-2 text-sm sm:text-base">
                <div><strong>Total accesos:</strong> {turno.accesos?.length || 0}</div>
                <div><strong>Accesos activos:</strong> {turno.accesos?.filter(a => !a.horaSalida).length || 0}</div>
                <div><strong>ID retenidas:</strong> {turno.accesos?.filter(a => a.identificacionId).length || 0}</div>
                <div><strong>Usuarios con Control de acceso:</strong> {contarUsuariosConFiltro()}</div>
                <div><strong>Porcentaje con Control de acceso:</strong> {usuariosConFiltro.length > 0 ?
                  `${Math.round((contarUsuariosConFiltro() / usuariosConFiltro.length) * 100)}%` : '0%'
                }</div>
              </div>
            </div>

            {/* Información del Sistema */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🔧 Sistema</h3>
              <div className="space-y-2 text-sm sm:text-base">
                <div><strong>Fecha creación:</strong> {new Date(turno.fechaCreacion).toLocaleString()}</div>
                <div><strong>Última actualización:</strong> {new Date(turno.fechaActualizacion).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
            <button
              onClick={() => navigate('/turnos')}
              className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base order-2 sm:order-1"
            >
              ← Volver a la lista
            </button>
            {isAdmin && (
              <>
                {turno.estaActivo && (
                  <button
                    onClick={() => navigate(`/turnos/${turno.id}/asignar`)}
                    className="px-4 sm:px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm sm:text-base order-1 sm:order-2"
                  >
                    👥 Gestionar Asignaciones
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurnoView;