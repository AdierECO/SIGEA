import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import type { Acceso } from '../../types';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';

const AccesoView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [acceso, setAcceso] = useState<Acceso | null>(null);
  const [creadorData, setCreadorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [registrandoSalida, setRegistrandoSalida] = useState(false);
  const navigate = useNavigate();
  const { usuario } = useAuth();

  useEffect(() => {
    fetchAcceso();
  }, [id]);

  useEffect(() => {
    if (usuario?.rol === 'OPERATIVO' && (!usuario?.nombre?.trim() || !usuario?.apellidos?.trim())) {
      navigate('/nombre-ingreso', { replace: true });
    }
  }, [usuario, navigate]);

  const fetchAcceso = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/accesos/${id}`);
      const accesoData = response.data;
      setAcceso(accesoData);

      // Cargar datos del usuario creador para obtener filtro y turno
      if (accesoData.creadoPor) {
        try {
          const creadorResponse = await api.get(`/usuarios/${accesoData.creadoPor}`);
          setCreadorData(creadorResponse.data);
        } catch (error) {
          console.error('❌ Error cargando datos del creador:', error);
        }
      }

    } catch (error) {
      console.error('❌ Error fetching acceso:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarSalida = async () => {
    if (!acceso) return;

    const { isConfirmed } = await Swal.fire({
      title: '¿Registrar salida?',
      text: '¿Estás seguro de registrar la salida?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      customClass: { popup: "alert" }
    });

    if (!isConfirmed) return;

    setRegistrandoSalida(true);

    try {
      await api.patch(`/accesos/${id}/salida`);
      await fetchAcceso();
      Swal.fire({
        icon: "success",
        text: "Salida registrada exitosamente",
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });
    } catch (error: any) {
      console.error('❌ Error registrando salida:', error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `Error: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setRegistrandoSalida(false);
    }
  };

  //  Función para determinar si es Acceso Especial
  const esAccesoEspecial = (): boolean => {
    return acceso?.nombre === 'ACCESO' && acceso?.apellidos === 'ESPECIAL';
  };

  //  Función para separar el área en sus componentes
  const parseAreaComponents = (areaString: string | null) => {
    if (!areaString) return { direccion: null, subdireccion: null, gerencia: null };

    const parts = areaString.split(' - ');
    return {
      direccion: parts[0] || null,
      subdireccion: parts[1] || null,
      gerencia: parts[2] || null
    };
  };

  // Función para separar la dirección del escolta
  const parseAcompananteComponents = (direccionString: string | null) => {
    if (!direccionString) return { direccion: null, subdireccion: null, gerencia: null };

    const parts = direccionString.split(' - ');
    return {
      direccion: parts[0] || null,
      subdireccion: parts[1] || null,
      gerencia: parts[2] || null
    };
  };

  // Función para obtener quién registró el acceso
  const getRegistradoPor = () => {
    
  if (acceso?.registradoPor) {
    return acceso.registradoPor;
  }
  
  return 'No especificado';
};

  // Función para verificar si se puede editar
  const puedeEditar = (acceso: Acceso) => {
    // No se puede editar si está finalizado
    if (acceso.horaSalida) {
      return false;
    }

    // Superadmin y Administrador NO pueden editar
    if (usuario?.rol === 'SUPERADMIN' || usuario?.rol === 'ADMINISTRADOR') {
      return false;
    }

    // Solo OPERATIVOS con el mismo filtro pueden editar
    if (usuario?.rol === 'OPERATIVO') {
      if (usuario.filtroAsignadoId && acceso.filtroId === usuario.filtroAsignadoId) {
        return true;
      }
    }

    return false;
  };

  // Función para verificar si se puede registrar salida
  const puedeRegistrarSalida = (acceso: Acceso) => {
    // No se puede registrar salida si ya tiene salida
    if (acceso.horaSalida) {
      return false;
    }

    // Superadmin y Administrador NO pueden registrar salidas
    if (usuario?.rol === 'SUPERADMIN' || usuario?.rol === 'ADMINISTRADOR') {
      return false;
    }

    // Solo OPERATIVOS con el mismo control de acceso pueden registrar salida
    if (usuario?.rol === 'OPERATIVO') {
      if (usuario.filtroAsignadoId && acceso.filtroId === usuario.filtroAsignadoId) {
        return true;
      }
    }

    return false;
  };

  //  Función para mostrar información del filtro del acceso
  const getFiltroInfo = () => {
    if (acceso?.filtro) {
      return {
        texto: `${acceso.filtro.nombre}${acceso.filtro.ubicacion ? ` - ${acceso.filtro.ubicacion}` : ''}`,
        clase: 'text-purple-700 font-semibold',
        tipo: 'directo' as const
      };
    }

    if (creadorData?.filtroAsignado) {
      return {
        texto: `${creadorData.filtroAsignado.nombre}${creadorData.filtroAsignado.ubicacion ? ` - ${creadorData.filtroAsignado.ubicacion}` : ''} (del operativo)`,
        clase: 'text-blue-700 font-semibold',
        tipo: 'del_operativo' as const
      };
    }

    return {
      texto: 'Sin control de acceso asignado',
      clase: 'text-gray-500',
      tipo: 'sin_filtro' as const
    };
  };

  //  Función para obtener información del turno
  const getTurnoInfo = () => {
    if (acceso?.turno) {
      return {
        texto: acceso.turno.nombreTurno,
        clase: 'text-green-700 font-semibold',
        tipo: 'directo' as const
      };
    }

    if (creadorData?.turnosAsignados && creadorData.turnosAsignados.length > 0) {
      const turnosActivos = creadorData.turnosAsignados
        .filter((asignacion: any) => asignacion.turno.estaActivo)
        .map((asignacion: any) => asignacion.turno);

      if (turnosActivos.length > 0) {
        return {
          texto: `${turnosActivos[0].nombreTurno} (del operativo)`,
          clase: 'text-blue-700 font-semibold',
          tipo: 'del_operativo' as const
        };
      }
    }

    return {
      texto: 'Sin turno asignado',
      clase: 'text-gray-500',
      tipo: 'sin_turno' as const
    };
  };

  //  Función para obtener el mensaje de restricción
  const getMensajeRestriccion = () => {
    if (usuario?.rol === 'SUPERADMIN') {
      return false;
    }
    if (acceso?.horaSalida) {
      return false;
    }
    if (usuario?.id !== acceso?.creadoPor && usuario?.rol !== 'ADMINISTRADOR') {
      return false;
    }
    return '';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando información del acceso...</div>
        </div>
      </div>
    );
  }

  if (!acceso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">❌</div>
          <div className="text-red-800 font-semibold mb-2">Acceso no encontrado</div>
          <button
            onClick={() => navigate('/accesos')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-200"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  const filtroInfo = getFiltroInfo();
  const turnoInfo = getTurnoInfo();
  const mensajeRestriccion = getMensajeRestriccion();
  const esEspecial = esAccesoEspecial();

  //  Parsear los componentes del área y escolta
  const areaComponents = parseAreaComponents(acceso.area || '');
  const acompananteComponents = parseAcompananteComponents(acceso.direccionAcompanante || '');

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {esEspecial ? '🎪 Acceso Especial' : '👤 Acceso Normal'}
                  {esEspecial && (
                    <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-semibold">
                      ESPECIAL
                    </span>
                  )}
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  {esEspecial ? 'Registro de acceso especial' : 'Información completa del registro de acceso'}
                </p>

                {mensajeRestriccion && (
                  <div className="mt-2">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">
                      ⚠️ {mensajeRestriccion}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {puedeEditar(acceso) ? (
                  <button
                    onClick={() => navigate(`/accesos/editar/${acceso.id}`)}
                    className="px-3 sm:px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition duration-200 flex items-center justify-center text-sm sm:text-base"
                  >
                    ✏️ Editar
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-3 sm:px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                  >
                    {acceso.horaSalida ? '🔒 Finalizado' : '🔒 No puede editar '}
                  </button>
                )}

                {puedeRegistrarSalida(acceso) ? (
                  <button
                    onClick={handleRegistrarSalida}
                    disabled={registrandoSalida}
                    className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition duration-200 flex items-center justify-center text-sm sm:text-base"
                  >
                    {registrandoSalida ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Registrando...
                      </>
                    ) : (
                      '🚪 Registrar Salida'
                    )}
                  </button>
                ) : (
                  !acceso.horaSalida && (
                    <button
                      disabled
                      className="px-3 sm:px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
                    >
                      🔒 No puede dar salida
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Información Personal - Solo para Acceso Normal */}
            {!esEspecial && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">👤 Información Personal</h3>
                <div className="space-y-3 text-sm sm:text-base">
                  <div><strong>Nombre:</strong> {acceso.nombre} {acceso.apellidos}</div>
                  <div><strong>Teléfono:</strong> {acceso.telefono || 'No proporcionado'}</div>
                  <div><strong>Empresa:</strong> {acceso.empresa || 'No especificada'}</div>
                </div>
              </div>
            )}

            {/* Información de Visita con Área Separada */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-4">🏢 Información de Visita</h3>
              <div className="space-y-3 text-sm sm:text-base">
                <div><strong>Motivo:</strong> {acceso.motivo}</div>

                {/*  Área separada en componentes */}
                <div className="space-y-2">
                  <div><strong>Área de Visita:</strong></div>
                  {areaComponents.direccion && (
                    <div className="ml-4">
                      <strong>Dirección:</strong> {areaComponents.direccion}
                    </div>
                  )}
                  {areaComponents.subdireccion && (
                    <div className="ml-4">
                      <strong>Subdirección:</strong> {areaComponents.subdireccion}
                    </div>
                  )}
                  {areaComponents.gerencia && (
                    <div className="ml-4">
                      <strong>Gerencia:</strong> {areaComponents.gerencia}
                    </div>
                  )}
                  {!areaComponents.direccion && (
                    <div className="text-gray-500 italic">No especificada</div>
                  )}
                </div>

                <div><strong>Escolta:</strong> {acceso.tieneAcompanante ? 'Sí' : 'No'}</div>
              </div>
            </div>

            {/* Información del Escolta con Dirección Separada */}
            {acceso.tieneAcompanante && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-900 mb-4">👥 Información del Escolta</h3>
                <div className="space-y-3 text-sm sm:text-base">
                  <div><strong>Nombre:</strong> {acceso.nombreAcompanante || 'No especificado'}</div>

                  {/*  Dirección del escolta separada en componentes */}
                  <div className="space-y-2">
                    <div><strong>Ubicación Perteneciente:</strong></div>
                    {acompananteComponents.direccion && (
                      <div className="ml-4">
                        <strong>Dirección:</strong> {acompananteComponents.direccion}
                      </div>
                    )}
                    {acompananteComponents.subdireccion && (
                      <div className="ml-4">
                        <strong>Subdirección:</strong> {acompananteComponents.subdireccion}
                      </div>
                    )}
                    {acompananteComponents.gerencia && (
                      <div className="ml-4">
                        <strong>Gerencia:</strong> {acompananteComponents.gerencia}
                      </div>
                    )}
                    {!acompananteComponents.direccion && (
                      <div className="text-gray-500 italic">No especificada</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Información del Grupo */}
            {acceso.conGrupo && (
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-indigo-900 mb-4">👨‍👩‍👧‍👦 Información del Grupo</h3>
                <div className="space-y-3 text-sm sm:text-base">
                  <div><strong>Viene en grupo:</strong> Sí</div>
                  <div><strong>Cantidad de personas:</strong> {acceso.cantidadGrupo}</div>
                </div>
              </div>
            )}

            {/* Identificación */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">🆔 Identificación</h3>
              <div className="space-y-3 text-sm sm:text-base">
                {acceso.identificacion ? (
                  <>
                    <div><strong>Tipo:</strong> {acceso.identificacion.tipo}</div>
                    <div><strong>Número:</strong> {acceso.identificacion.numero || 'Sin número'}</div>
                    <div>
                      <strong>Estado:</strong>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${acceso.identificacion.vigente
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {acceso.identificacion.vigente ? 'VIGENTE' : 'NO VIGENTE'}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 italic">
                    {esEspecial ? 'Acceso Especial sin identificación' : 'Sin identificación registrada'}
                  </div>
                )}
              </div>
            </div>

            {/* Información del Filtro */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">🚪Control de acceso del Acceso</h3>
              <div className="space-y-3 text-sm sm:text-base">
                {filtroInfo.tipo === 'directo' && acceso.filtro && acceso.tias ? (
                  <>
                    <div><strong>Nombre:</strong> {acceso.filtro.nombre}</div>
                    {acceso.filtro.descripcion && (
                      <div><strong>Descripción:</strong> {acceso.filtro.descripcion}</div>
                    )}
                    {acceso.filtro.ubicacion && (
                      <div><strong>Ubicación:</strong> {acceso.filtro.ubicacion}</div>
                    )}
                    <div>
                      <strong>Estado:</strong>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${acceso.filtro.estaActivo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {acceso.filtro.estaActivo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>
                    <div><strong>Gafete de visitante: </strong> {acceso.tias.id}</div>
                  </>
                ) : filtroInfo.tipo === 'del_operativo' && creadorData?.filtroAsignado ? (
                  <>
                    <div><strong>Nombre:</strong> {creadorData.filtroAsignado.nombre}</div>
                    {creadorData.filtroAsignado.descripcion && (
                      <div><strong>Descripción:</strong> {creadorData.filtroAsignado.descripcion}</div>
                    )}
                    {creadorData.filtroAsignado.ubicacion && (
                      <div><strong>Ubicación:</strong> {creadorData.filtroAsignado.ubicacion}</div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500 italic">No se asignó ningún control de acceso específico</div>
                )}
              </div>
            </div>

            {/* Información del Turno */}
            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-teal-900 mb-4">🕐 Turno de Registro</h3>
              <div className="space-y-3 text-sm sm:text-base">
                {turnoInfo.tipo === 'directo' && acceso.turno ? (
                  <>
                    <div><strong>Nombre:</strong> {acceso.turno.nombreTurno}</div>
                    <div><strong>Hora inicio:</strong> {new Date(acceso.turno.horaInicio).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}</div>
                    {acceso.turno.horaFin && (
                      <div><strong>Hora fin:</strong> {new Date(acceso.turno.horaFin).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}</div>
                    )}
                  </>
                ) : turnoInfo.tipo === 'del_operativo' && creadorData?.turnosAsignados ? (
                  <>
                    <div><strong>Nombre:</strong> {turnoInfo.texto.replace(' (del operativo)', '')}</div>
                  </>
                ) : (
                  <div className="text-gray-500 italic">No se asignó ningún turno específico</div>
                )}
              </div>
            </div>

            {/* Horarios */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-900 mb-4">🕐 Horarios de Acceso</h3>
              <div className="space-y-3 text-sm sm:text-base">
                <div><strong>Hora de entrada:</strong> {new Date(acceso.horaEntrada).toLocaleString()}</div>
                <div>
                  <strong>Hora de salida:</strong>
                  {acceso.horaSalida
                    ? new Date(acceso.horaSalida).toLocaleString()
                    : <span className="text-green-600 ml-2 font-semibold">PENDIENTE</span>
                  }
                </div>
                <div>
                  <strong>Estado:</strong>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${acceso.horaSalida
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-green-100 text-green-800'
                    }`}>
                    {acceso.horaSalida ? 'FINALIZADO' : 'ACTIVO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Información del Sistema */}
            <div className="bg-gray-50 p-4 rounded-lg lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Información del Sistema</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
                <div className="space-y-2">
                  <div><strong>Registrado por:</strong> {getRegistradoPor()}</div>
                  <div><strong>Fecha de registro:</strong> {new Date(acceso.fechaCreacion).toLocaleString()}</div>
                </div>
                <div className="space-y-2">
                  <div><strong>Última actualización:</strong> {new Date(acceso.fechaActualizacion).toLocaleString()}</div>
                  <div><strong>Turno asignado:</strong> <span className={turnoInfo.clase}>{turnoInfo.texto}</span></div>
                  <div><strong>Control de acceso asignado:</strong> <span className={filtroInfo.clase}>{filtroInfo.texto}</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => navigate('/accesos')}
              className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 text-sm sm:text-base"
            >
              ← Volver a la lista
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccesoView;