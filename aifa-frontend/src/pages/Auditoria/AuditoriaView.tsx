import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { auditoriaService } from '../../services/auditoria.service';
import type { DetalleAuditoria } from '../../types';
import Navbar from '../../components/Navbar';

const AuditoriaView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const [detalle, setDetalle] = useState<DetalleAuditoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();

  // Cargar detalles de auditoría desde tu API real
  useEffect(() => {
    const cargarDetalle = async () => {
      if (!id) {
        setError('ID no proporcionado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Llamada real a tu API
        const response = await auditoriaService.getDetalleAuditoria(id);
        setDetalle(response);
      } catch (err) {
        console.error('Error cargando detalle de auditoría:', err);
        setError('No se pudo cargar el detalle de auditoría');
      } finally {
        setLoading(false);
      }
    };

    cargarDetalle();
  }, [id]);

  const getColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'ACCESO': return 'bg-green-100 text-green-800 border-green-200';
      case 'TURNO': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IDENTIFICACION': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'REPORTE': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'FILTRO': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'SISTEMA': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'ACCESO': return '🚪';
      case 'TURNO': return '⏰';
      case 'IDENTIFICACION': return '🆔';
      case 'REPORTE': return '📊';
      case 'FILTRO': return '🔍';
      case 'SISTEMA': return '⚙️';
      default: return '📝';
    }
  };

  // Función para formatear el usuario (nombre + email)
  const formatUsuario = (detalle: DetalleAuditoria): string => {
    if (detalle.nombre && detalle.email) {
      return `${detalle.nombre} (${detalle.email})`;
    }
    if (detalle.nombre) {
      return detalle.nombre;
    }
    if (detalle.email) {
      return detalle.email;
    }
    return detalle.usuario || 'Usuario no disponible';
  };

  // Función para separar fecha y hora si vienen juntas
  const separarFechaHora = (fechaCompleta: string) => {
    // Si la fecha ya viene separada (solo fecha)
    if (!fechaCompleta.includes(' ')) {
      return {
        fecha: fechaCompleta,
        hora: '',
        completa: fechaCompleta
      };
    }

    // Si viene con fecha y hora
    const [fecha, hora] = fechaCompleta.split(' ');
    return {
      fecha,
      hora,
      completa: fechaCompleta
    };
  };

  // Función para renderizar detalles específicos según el tipo
  const renderDetallesEspecificos = () => {
    if (!detalle) return null;

    switch (detalle.tipo) {
      case 'ACCESO':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">🚪 Detalles del Acceso</h3>
              <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                {detalle.detalles.persona && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Persona:</span>
                    <span className="font-medium text-right truncate">{detalle.detalles.persona}</span>
                  </div>
                )}
                {detalle.detalles.identificacion && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Identificación:</span>
                    <span className="font-mono font-medium text-sm sm:text-base truncate">{detalle.detalles.identificacion}</span>
                  </div>
                )}
                {detalle.detalles.area && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Área:</span>
                    <span className="font-medium text-right truncate">{detalle.detalles.area}</span>
                  </div>
                )}
                {detalle.detalles.filtro && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Control de acceso:</span>
                    <span className="font-medium text-right truncate">{detalle.detalles.filtro}</span>
                  </div>
                )}
                {detalle.detalles.filtroId && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">ID Control de acceso:</span>
                    <span className="font-mono font-medium text-sm sm:text-base truncate">#{detalle.detalles.filtroId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Información del operativo para accesos */}
            {(detalle.detalles.registradoPor || detalle.detalles.registradoPorEmail) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">👤 Información del Operativo</h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                  {detalle.detalles.registradoPor && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-gray-600 text-sm sm:text-base">Operativo:</span>
                      <span className="font-medium text-blue-600 text-right truncate">{detalle.detalles.registradoPor}</span>
                    </div>
                  )}
                  {detalle.detalles.registradoPorRol && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-gray-600 text-sm sm:text-base">Rol:</span>
                      <span className="font-medium text-right truncate">{detalle.detalles.registradoPorRol}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'TURNO':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">⏰ Detalles del Turno</h3>
            <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
              {detalle.detalles.turno && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="text-gray-600 text-sm sm:text-base">Nombre del Turno:</span>
                  <span className="font-medium text-right truncate">{detalle.detalles.turno}</span>
                </div>
              )}
              {detalle.detalles.filtro && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="text-gray-600 text-sm sm:text-base">Control de acceso Asignado:</span>
                  <span className="font-medium text-right truncate">{detalle.detalles.filtro}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'IDENTIFICACION':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">🆔 Detalles de Identificación</h3>
              <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                {detalle.detalles.identificacion && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Número:</span>
                    <span className="font-mono font-medium text-sm sm:text-base truncate">{detalle.detalles.identificacion}</span>
                  </div>
                )}
                {detalle.detalles.filtro && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Control de acceso Asociado:</span>
                    <span className="font-medium text-right truncate">{detalle.detalles.filtro}</span>
                  </div>
                )}
                {detalle.detalles.filtroId && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">ID Control de acceso:</span>
                    <span className="font-mono font-medium text-sm sm:text-base truncate">#{detalle.detalles.filtroId}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Información del operativo para identificaciones */}
            {(detalle.detalles.registradoPor || detalle.detalles.registradoPorEmail) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">👤 Información del Operativo</h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
                  {detalle.detalles.registradoPor && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-gray-600 text-sm sm:text-base">Operativo:</span>
                      <span className="font-medium text-blue-600 text-right truncate">{detalle.detalles.registradoPor}</span>
                    </div>
                  )}
                  {detalle.detalles.registradoPorEmail && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-gray-600 text-sm sm:text-base">Email operativo:</span>
                      <span className="font-medium text-right truncate">{detalle.detalles.registradoPorEmail}</span>
                    </div>
                  )}
                  {detalle.detalles.registradoPorRol && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-gray-600 text-sm sm:text-base">Rol:</span>
                      <span className="font-medium text-right truncate">{detalle.detalles.registradoPorRol}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Información del primer acceso relacionado */}
            {detalle.detalles.personaPrimerAcceso && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">📋 Información del Primer Acceso</h3>
                <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Persona del acceso:</span>
                    <span className="font-medium text-right truncate">{detalle.detalles.personaPrimerAcceso}</span>
                  </div>
                  {detalle.detalles.primerAccesoId && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                      <span className="text-gray-600 text-sm sm:text-base">ID del acceso:</span>
                      <span className="font-mono font-medium text-sm sm:text-base truncate">#{detalle.detalles.primerAccesoId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'FILTRO':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">🔍 Detalles del Control de acceso</h3>
            <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
              {detalle.detalles.filtro && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="text-gray-600 text-sm sm:text-base">Nombre:</span>
                  <span className="font-medium text-right truncate">{detalle.detalles.filtro}</span>
                </div>
              )}
              {detalle.detalles.filtroId && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="text-gray-600 text-sm sm:text-base">ID:</span>
                  <span className="font-mono font-medium text-sm sm:text-base truncate">#{detalle.detalles.filtroId}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'REPORTE':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">📊 Detalles del Reporte</h3>
            <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-gray-600 text-sm sm:text-base">Tipo de Reporte:</span>
                <span className="font-medium text-right truncate">{detalle.accion}</span>
              </div>
              {detalle.detalles.filtro && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                  <span className="text-gray-600 text-sm sm:text-base">Filtro:</span>
                  <span className="font-medium text-right truncate">{detalle.detalles.filtro}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'SISTEMA':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">⚙️ Detalles del Sistema</h3>
            <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-gray-600 text-sm sm:text-base">Módulo:</span>
                <span className="font-medium text-right truncate">{detalle.descripcion}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-gray-600 text-sm sm:text-base">Acción:</span>
                <span className="font-medium text-right truncate">{detalle.accion}</span>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">📋 Detalles del Evento</h3>
            <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-gray-600 text-sm sm:text-base">Acción:</span>
                <span className="font-medium text-right truncate">{detalle.accion}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                <span className="text-gray-600 text-sm sm:text-base">Descripción:</span>
                <span className="font-medium text-right truncate">{detalle.descripcion}</span>
              </div>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando detalles de auditoría...</div>
        </div>
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Registro no encontrado'}
          </h2>
          <p className="text-gray-600 mb-4">El registro de auditoría solicitado no existe o no se pudo cargar.</p>
          <button
            onClick={() => navigate('/logs/sistema')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ← Volver al listado
          </button>
        </div>
      </div>
    );
  }

  const { fecha, hora } = separarFechaHora(detalle.fecha);

  return (
    <div className="min-h-screen bg-white py-8">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header con Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => navigate('/logs/sistema')}
              className="hover:text-blue-600 transition-colors hover:underline whitespace-nowrap"
            >
              Auditoría
            </button>
            <span className="whitespace-nowrap">›</span>
            <span className="text-gray-900 font-medium whitespace-nowrap">Detalles del registro</span>
          </nav>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {getIconoTipo(detalle.tipo)} Detalles de Auditoría
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Registro ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs sm:text-sm">#{detalle.id}</span>
              </p>
            </div>
            <div className="w-full sm:w-auto text-left sm:text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getColorTipo(detalle.tipo)}`}>
                {getIconoTipo(detalle.tipo)} {detalle.tipo}
              </span>
              <div className="text-xs sm:text-sm text-gray-500 mt-2 flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                <div className="bg-gray-100 px-2 py-1 rounded mb-1 sm:mb-0">{fecha}</div>
                {hora && <div className="bg-gray-100 py-1 rounded">{hora}</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                <span className="text-blue-600 text-xl">👤</span>
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <h3 className="text-sm font-medium text-gray-600">Usuario</h3>
                {detalle.nombre && detalle.email ? (
                  <>
                    <p className="text-base sm:text-lg font-semibold text-gray-900 truncate" title={detalle.nombre}>
                      {detalle.nombre}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate" title={detalle.email}>
                      {detalle.email}
                    </p>
                  </>
                ) : (
                  <p className="text-base sm:text-lg font-semibold text-gray-900 truncate" title={formatUsuario(detalle)}>
                    {formatUsuario(detalle)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <span className="text-green-600 text-xl">⚡</span>
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <h3 className="text-sm font-medium text-gray-600">Acción</h3>
                <p className="text-base sm:text-lg font-semibold text-gray-900 truncate" title={detalle.accion}>
                  {detalle.accion}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 truncate mt-1" title={detalle.descripcion}>
                  {detalle.descripcion}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navegación por Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex overflow-x-auto space-x-4 sm:space-x-8 px-4 sm:px-6">
              {['general', 'detalles'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-colors flex-shrink-0 ${activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab === 'general' && '📋 Información General'}
                  {tab === 'detalles' && '📊 Detalles Específicos'}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* Tab: Información General */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* INFORMACIÓN ADICIONAL - SE MANTIENE COMO ORIGINAL */}
                  {detalle.detallesAdicionales && Object.keys(detalle.detallesAdicionales).length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">🔧 Información del Sistema</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                        {Object.entries(detalle.detallesAdicionales).map(([key, value]) => (
                          <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                            <span className="text-gray-600 text-sm sm:text-base capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="font-medium text-right truncate max-w-xs" title={value as string}>
                              {value as string}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">🛡️ Información de Auditoría</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-gray-600 text-sm sm:text-base">Consultado por:</span>
                        <span className="font-medium text-right truncate">{usuario?.nombre} {usuario?.apellidos}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-gray-600 text-sm sm:text-base">Rol:</span>
                        <span className="font-medium text-right capitalize">{usuario?.rol?.toLowerCase()}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-gray-600 text-sm sm:text-base">Fecha de consulta:</span>
                        <span className="font-medium text-right">
                          {new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-gray-600 text-sm sm:text-base">ID del registro:</span>
                        <span className="font-mono font-medium text-sm sm:text-base text-right">#{detalle.id}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {detalle.respuesta && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">📊 Resultado de la Operación</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                        <span className="text-gray-600 text-sm sm:text-base">Estado:</span>
                        <span className="font-medium text-green-600 text-right">{detalle.respuesta.mensaje}</span>
                      </div>
                      {detalle.respuesta.datos && Object.keys(detalle.respuesta.datos).length > 0 && (
                        <div className="space-y-2">
                          <span className="text-gray-600 block text-sm sm:text-base">Datos generados:</span>
                          <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden shadow-lg">
                            <pre className="text-yellow-300 p-4 text-xs sm:text-sm overflow-x-auto font-mono bg-gray-900">
                              {JSON.stringify(detalle.respuesta.datos, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Detalles Específicos */}
            {activeTab === 'detalles' && (
              <div className="space-y-6">
                {renderDetallesEspecificos()}

                {detalle.parametros && Object.keys(detalle.parametros).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">⚙️ Parámetros de la Operación</h3>
                    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden shadow-lg">
                      <pre className="text-green-400 p-4 text-xs sm:text-sm overflow-x-auto font-mono bg-gray-900">
                        {JSON.stringify(detalle.parametros, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={() => {
              if (usuario?.rol === 'SUPERVISOR') {
                navigate('/filtro');
              } else {
                navigate('/logs/sistema');
              }
            }}
            className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
          >
            <span>←</span>
            <span>Volver al listado</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditoriaView;