import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Acceso } from '../../types';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';

const AccesoList: React.FC = () => {
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'todos' | 'activos' | 'finalizados'>('todos');
  const [filterFiltro, setFilterFiltro] = useState<string>('todos');
  const [filtrosDisponibles, setFiltrosDisponibles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [filtroAsignado, setFiltroAsignado] = useState<any>(null);

  useEffect(() => {
    fetchAccesos();
    fetchFiltrosDisponibles();
    fetchUsuarioFiltroAsignado();
  }, []);

  useEffect(() => {
    if (usuario?.rol === 'OPERATIVO' && (!usuario?.nombre?.trim() || !usuario?.apellidos?.trim())) {
      navigate('/nombre-ingreso', { replace: true });
    }
  }, [usuario, navigate]);

  // Establecer control de acceso por defecto según el control de acceso del operativo
  useEffect(() => {
    if (usuario?.rol === 'OPERATIVO' && usuario.filtroAsignadoId) {
      setFilterFiltro(usuario.filtroAsignadoId.toString());
    }
  }, [usuario]);

  const fetchAccesos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/accesos');

      let accesosData: Acceso[] = [];

      if (response.data && response.data.accesos && Array.isArray(response.data.accesos)) {
        accesosData = response.data.accesos;
      } else if (Array.isArray(response.data)) {
        accesosData = response.data;
      } else {
        accesosData = response.data?.data || response.data || [];
      }

      setAccesos(accesosData);

    } catch (error: any) {
      setError(`Error al cargar los datos: ${error.response?.data?.error || error.message}`);
      setAccesos([]);
    } finally {
      setLoading(false);
    }
  };

  const parseAreaComponents = (areaString: string | null) => {
    if (!areaString) return { direccion: null, subdireccion: null, gerencia: null };

    const parts = areaString.split(' - ');
    return {
      direccion: parts[0] || null,
      subdireccion: parts[1] || null,
      gerencia: parts[2] || null
    };
  };

  const fetchFiltrosDisponibles = async () => {
    try {
      const response = await api.get('/filtros/activos');
      setFiltrosDisponibles(response.data);
    } catch (error) {
      console.error('Error cargando filtros:', error);
    }
  };

  const fetchUsuarioFiltroAsignado = async () => {
    try {
      if (usuario?.rol === 'OPERATIVO' && usuario.id) {
        const response = await api.get(`/usuarios/${usuario.id}`);
        const usuarioData = response.data;
        if (usuarioData.filtroAsignado) {
          setFiltroAsignado(usuarioData.filtroAsignado);
        }
      }
    } catch (error) {
      console.error('Error cargando filtro asignado:', error);
    }
  };

  const handleRegistrarSalida = async (accesoId: number) => {

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

    if (!isConfirmed) return
    Swal.fire({
      icon: "success",
      text: "Salida registrada exitosamente",
      title: "Aviso",
      timer: 2000,
      timerProgressBar: true,
      customClass: { popup: "alert" }
    });;

    try {
      await api.patch(`/accesos/${accesoId}/salida`);
      await fetchAccesos();
    } catch (error: any) {
      console.error('❌ Error registrando salida:', error);
      Swal.fire(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  // Función para verificar si se puede editar
  const puedeEditar = (acceso: Acceso) => {
    // Superadmin NO puede editar
    if (usuario?.rol === 'SUPERADMIN' || usuario?.rol === 'ADMINISTRADOR') {
      return false;
    }
    // No se puede editar si está finalizado
    if (acceso.horaSalida) {
      return false;
    }
    // No se puede editar si el filtro está desactivado
    if (filtroAsignado && !filtroAsignado.estaActivo) {
      return false;
    }

    if (usuario?.rol === 'OPERATIVO') {
      // Solo puede editar si TIENE control de acceso asignado y es el mismo control de acceso del acceso
      if (usuario.filtroAsignadoId && acceso.filtroId === usuario.filtroAsignadoId) {
        return true;
      }
    }

    return false;
  };

  // Función para verificar si se puede registrar salida
  const puedeRegistrarSalida = (acceso: Acceso) => {
    // Superadmin NO puede registrar salidas
    if (usuario?.rol === 'SUPERADMIN' || usuario?.rol === 'ADMINISTRADOR') {
      return false;
    }
    // No se puede registrar salida si ya tiene salida
    if (acceso.horaSalida) {
      return false;
    }
    // No se puede registrar salida si el filtro está desactivado
    if (filtroAsignado && !filtroAsignado.estaActivo) {
      return false;
    }

    if (usuario?.rol === 'OPERATIVO') {
      // Solo puede registrar salida si TIENE control de acceso asignado y es el mismo control de acceso del acceso
      if (usuario.filtroAsignadoId && acceso.filtroId === usuario.filtroAsignadoId) {
        return true;
      }
    }

    return false;
  };

  // Función para verificar si puede crear accesos
  const puedeCrearAccesos = () => {
    // Solo OPERATIVOS CON control de acceso asignado Y ACTIVO pueden crear accesos
    if (usuario?.rol === 'OPERATIVO' && usuario.filtroAsignadoId) {
      return filtroAsignado?.estaActivo === true;
    }
    return false;
  };

  // Función para verificar si el filtro asignado está activo
  const filtroEstaActivo = filtroAsignado?.estaActivo === true;

  // Controles de acceso
  const filteredAccesos = accesos.filter(acceso => {
    if (!acceso) return false;

    const matchesFilterEstado = filterEstado === 'todos' ? true :
      filterEstado === 'activos' ? !acceso.horaSalida :
        acceso.horaSalida;

    // Control de acceso por control de acceso
    const matchesFilterFiltro = filterFiltro === 'todos' ? true :
      filterFiltro === 'sin-filtro' ? !acceso.filtroId :
        acceso.filtroId === parseInt(filterFiltro);

    const matchesSearch = searchTerm === '' ||
      (acceso.nombre && acceso.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (acceso.apellidos && acceso.apellidos.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (acceso.empresa && acceso.empresa.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (acceso.area && acceso.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (acceso.nombreAcompanante && acceso.nombreAcompanante.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (acceso.identificacion?.numero && acceso.identificacion.numero.includes(searchTerm)) ||
      (acceso.filtro?.nombre && acceso.filtro.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (acceso.tias?.id && acceso.tias.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (acceso.registradoPor && acceso.registradoPor.toLowerCase().includes(searchTerm.toLowerCase())); // Búsqueda por registradoPor

    return matchesFilterEstado && matchesFilterFiltro && matchesSearch;
  });

  const getEstadoBadge = (acceso: Acceso) => {
    if (!acceso) return null;

    if (!acceso.horaSalida) {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">🟢 ACTIVO</span>;
    }
    return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-semibold">🔴 FINALIZADO</span>;
  };

  const getIdentificacionBadge = (identificacion: any) => {
    if (!identificacion) {
      return <span className="text-xs text-gray-500">Sin ID</span>;
    }

    return (
      <div className="flex flex-col space-y-1 min-w-0">
        <span className="text-xs text-gray-500 truncate">
          {identificacion.tipo}: {identificacion.numero || 'Sin número'}
        </span>
      </div>
    );
  };

  const getAcompananteBadge = (acceso: Acceso) => {
    if (!acceso.tieneAcompanante) {
      return <span className="text-xs text-gray-500">Sin escolta</span>;
    }

    return (
      <div className="flex flex-col space-y-1 min-w-0">
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
          👥 CON ESCOLTA
        </span>
        {acceso.nombreAcompanante && (
          <span className="text-xs text-gray-500 truncate">
            {acceso.nombreAcompanante}
          </span>
        )}
      </div>
    );
  };

  const getFiltroBadge = (filtro: any) => {
    if (!filtro) {
      return <span className="text-xs text-gray-500">Sin control de acceso</span>;
    }

    return (
      <div className="flex flex-col space-y-1 min-w-0">
        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
          🚪 {filtro.nombre}
        </span>
      </div>
    );
  };

  const getGrupoBadge = (acceso: Acceso) => {
    if (!acceso.conGrupo) {
      return <span className="text-xs text-gray-500">Individual</span>;
    }

    return (
      <div className="flex flex-col space-y-1 min-w-0">
        <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-xs font-semibold">
          👨‍👩‍👧‍👦 GRUPO
        </span>
        {acceso.cantidadGrupo && (
          <span className="text-xs text-gray-500 truncate">
            {acceso.cantidadGrupo} personas
          </span>
        )}
      </div>
    );
  };

  const getTiasBadge = (acceso: Acceso) => {
    if (!acceso.tias) {
      return <span className="text-xs text-gray-500">Sin TIA</span>;
    }

    return (
      <div className="flex flex-col space-y-1 min-w-0 text-xs text-gray-500">
        {acceso.tias.id}
      </div>
    );
  };

  // Estadísticas basadas en todos los accesos
  const estadisticas = {
    total: filteredAccesos.length,
    activos: filteredAccesos.filter(a => a && !a.horaSalida).length,
    finalizados: filteredAccesos.filter(a => a && a.horaSalida).length,
    conAcompanante: filteredAccesos.filter(a => a && a.tieneAcompanante).length,
    conFiltro: filteredAccesos.filter(a => a && a.filtroId).length,
    conGrupo: filteredAccesos.filter(a => a && a.conGrupo).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando accesos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-4xl mb-4">❌</div>
          <div className="text-red-800 font-semibold mb-2">Error al cargar los datos</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={fetchAccesos}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <Navbar />
      <div className="max-w-[95vw] mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">🚪 Gestión de Accesos</h1>
              <p className="text-gray-600 text-sm sm:text-base">Registro y control de accesos al AIFA</p>

              {/* Indicador de permisos y visibilidad */}
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${usuario?.rol === 'SUPERADMIN'
                  ? 'bg-purple-100 text-purple-800'
                  : usuario?.rol === 'ADMINISTRADOR'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                  }`}>
                  {usuario?.rol}
                </span>
                {usuario?.rol === 'OPERATIVO' && usuario.filtroAsignadoId && (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${filtroEstaActivo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                    }`}>
                    {filtroAsignado?.nombre} - {filtroEstaActivo ? 'ACTIVO' : 'DESACTIVADO'}
                  </span>
                )}
              </div>
            </div>
            {/* Solo OPERATIVOS CON control de acceso ACTIVO pueden crear accesos */}
            {puedeCrearAccesos() && (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm sm:text-base"
                  onClick={() => navigate('/accesos/crear')}
                >
                  <span className="mr-2">+</span> Acceso Normal
                </button>
                <button
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 sm:px-6 py-2 rounded-lg flex items-center justify-center transition duration-200 text-sm sm:text-base"
                  onClick={() => navigate('/accesospecial/crear')}
                >
                  <span className="mr-2">+</span> Acceso Especial
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nombre, apellidos, empresa, área, control de acceso, TIA, nombre del escolta, número de identificación o registrado por..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              />
            </div>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as any)}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="todos">Todos los estados</option>
              <option value="activos">Accesos activos</option>
              <option value="finalizados">Accesos finalizados</option>
            </select>

            {/* control de acceso por control de acceso - todos pueden usar */}
            <select
              value={filterFiltro}
              onChange={(e) => setFilterFiltro(e.target.value)}
              className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            >
              <option value="todos">Todos los controles de acceso</option>
              <option value="sin-filtro">Sin control de acceso</option>
              {filtrosDisponibles.map(filtro => (
                <option key={filtro.id} value={filtro.id}>
                  {filtro.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{estadisticas.total}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Accesos</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{estadisticas.activos}</div>
            <div className="text-xs sm:text-sm text-gray-600">Accesos Activos</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{estadisticas.conAcompanante}</div>
            <div className="text-xs sm:text-sm text-gray-600">Con Escolta</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
            <div className="text-xl sm:text-2xl font-bold text-indigo-600">{estadisticas.conGrupo}</div>
            <div className="text-xs sm:text-sm text-gray-600">Con Grupo</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{estadisticas.conFiltro}</div>
            <div className="text-xs sm:text-sm text-gray-600">Con control de acceso</div>
          </div>
          <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border">
            <div className="text-xl sm:text-2xl font-bold text-gray-600">{estadisticas.finalizados}</div>
            <div className="text-xs sm:text-sm text-gray-600">Accesos Finalizados</div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Persona</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-64">Información</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Escolta</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Grupo</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Identificación</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Control de acceso</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Gafete</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">Horario</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Estado</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-50">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccesos.map((acceso) => (
                  <tr key={acceso.id} className="hover:bg-gray-50 transition duration-150">
                    {/* Persona */}
                    <td className="px-3 sm:px-4 py-2">
                      <div className="flex items-center min-w-0">
                        <div className="flex-shrink-0 h-8 sm:h-10 w-8 sm:w-10 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs sm:text-sm">
                            {acceso.nombre?.charAt(0) || 'N'}{acceso.apellidos?.charAt(0) || 'A'}
                          </span>
                        </div>
                        <div className="ml-2 sm:ml-3 min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {acceso.nombre || ''} {acceso.apellidos || ''}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 truncate">{acceso.telefono || ''}</div>
                          {/* Cambiado a mostrar quién registró el acceso */}
                          {acceso.registradoPor && (
                            <div className="text-xs text-blue-600 truncate" title={`Registrado por: ${acceso.registradoPor}`}>
                              {acceso.registradoPor}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Información */}
                    <td className="px-3 sm:px-4 py-2">
                      <div className="text-sm text-gray-900 truncate">{acceso.empresa || 'Sin empresa'}</div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate" title={acceso.motivo}>
                        {acceso.motivo}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Área: {(() => {
                        const areaComponents = parseAreaComponents(acceso.area || '');
                        return areaComponents.subdireccion || areaComponents.direccion || 'Sin área';
                      })()}</div>
                    </td>

                    {/* Escolta */}
                    <td className="px-3 sm:px-4 py-2">
                      {getAcompananteBadge(acceso)}
                    </td>

                    {/* Grupo */}
                    <td className="px-3 sm:px-4 py-2">
                      {getGrupoBadge(acceso)}
                    </td>

                    {/* Identificación */}
                    <td className="px-3 sm:px-4 py-2">
                      {acceso.identificacion ? getIdentificacionBadge(acceso.identificacion) : 'Sin identificación'}
                    </td>

                    {/* control de acceso */}
                    <td className="px-3 sm:px-4 py-2">
                      {getFiltroBadge(acceso.filtro)}
                    </td>

                    {/* TIA */}
                    <td className="px-3 sm:px-4 py-2">
                      {getTiasBadge(acceso)}
                    </td>

                    {/* Horario */}
                    <td className="px-3 sm:px-4 py-2">
                      <div className="text-xs sm:text-sm text-gray-900">
                        <div className="font-semibold">Entrada:</div>
                        <div className="truncate">{new Date(acceso.horaEntrada).toLocaleString()}</div>
                      </div>
                      {acceso.horaSalida && (
                        <div className="text-xs sm:text-sm text-green-600 mt-1">
                          <div className="font-semibold">Salida:</div>
                          <div className="truncate">{new Date(acceso.horaSalida).toLocaleString()}</div>
                        </div>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-3 sm:px-4 py-2">
                      {getEstadoBadge(acceso)}
                    </td>

                    {/* Acciones */}
                    <td className="px-3 sm:px-4 py-2">
                      <div className="flex flex-col space-y-1 sm:space-y-2">
                        <button
                          onClick={() => navigate(`/accesos/ver/${acceso.id}`)}
                          className="text-blue-600 hover:text-blue-900 text-xs bg-blue-50 px-2 sm:px-3 py-1 rounded transition duration-200 w-full text-center"
                        >
                          👁 Ver
                        </button>

                        {/* Botón Editar condicional*/}
                        {puedeEditar(acceso) && (
                          <button
                            onClick={() => navigate(`/accesos/editar/${acceso.id}`)}
                            className="text-yellow-600 hover:text-yellow-900 text-xs bg-yellow-50 px-2 sm:px-3 py-1 rounded transition duration-200 w-full text-center"
                          >
                            ✏️ Editar
                          </button>
                        )}

                        {/* Botón Salida condicional */}
                        {puedeRegistrarSalida(acceso) && (
                          <button
                            onClick={() => handleRegistrarSalida(acceso.id!)}
                            className="text-green-600 hover:text-green-900 text-xs bg-green-50 px-2 sm:px-3 py-1 rounded transition duration-200 w-full text-center"
                          >
                            🚪 Salida
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredAccesos.length === 0 && (
          <div className="text-center py-8 sm:py-12 bg-white rounded-lg border">
            <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🔍</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No se encontraron accesos</h3>
            <p className="text-gray-600 text-sm sm:text-base">
              No hay resultados con los filtros aplicados
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccesoList;