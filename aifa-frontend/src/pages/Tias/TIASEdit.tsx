import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { UpdateTIASDto, TIASWithRelations, FiltroOption } from '../../types';
import Swal from 'sweetalert2';

// Interface para la respuesta de Gafetes disponibles
interface TIASDisponible {
  id: string;
  tipo: string;
  estado: boolean;
  filtro?: {
    id: number;
    nombre: string;
  };
  _count: {
    accesos: number;
  };
}

const TIASEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filtros, setFiltros] = useState<FiltroOption[]>([]);
  const [tias, setTias] = useState<TIASWithRelations | null>(null);
  const [tiasDisponibles, setTiasDisponibles] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<UpdateTIASDto>({
    tipo: '',
    filtroId: undefined
  });

  const isAdmin = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'SUPERADMIN';

  useEffect(() => {
    if (id) {
      fetchTIAS();
      fetchFiltros();
      fetchTIASDisponibles();
    }
  }, [id]);

  const fetchTIAS = async () => {
    try {
      const response = await api.get(`/tias/${id}`);
      setTias(response.data);
      setFormData({
        tipo: response.data.tipo,
        filtroId: response.data.filtroId || undefined
      });
    } catch (error) {
      console.error('Error fetching TIAS:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Error al cargar TIAS',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'alert' }
      });
      navigate('/tias');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiltros = async () => {
    try {
      const response = await api.get('/filtros/activos');
      setFiltros(response.data);
    } catch (error) {
      console.error('Error fetching Controlws de acceso:', error);
    }
  };

  const fetchTIASDisponibles = async () => {
    try {
      const response = await api.get<{ tias: TIASDisponible[] }>('/tias/disponibles');
      const disponiblesSet = new Set<string>(
        response.data.tias.map((tia: TIASDisponible) => tia.id)
      );
      setTiasDisponibles(disponiblesSet);
    } catch (error) {
      console.error('Error fetching TIAS disponibles:', error);
      setTiasDisponibles(new Set<string>());
    }
  };

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      tipo: value
    }));
  };

  const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      filtroId: value === '' ? null : (value ? Number(value) : undefined)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tipo?.trim()) {
      await Swal.fire({
        title: 'Error',
        text: 'El tipo de Gafete es requerido',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'alert' }
      });
      return;
    }

    if (formData.tipo.length > 5) {
      await Swal.fire({
        title: 'Error',
        text: 'El tipo no puede tener más de 5 caracteres',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'alert' }
      });
      return;
    }

    setSaving(true);
    try {
      await api.put(`/tias/${id}`, formData);
      await Swal.fire({
        icon: "success",
        text: "Gafete de visita actualizado exitosamente",
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });
      navigate('/tias');
    } catch (error: any) {
      console.error('Error updating Gafete:', error);
      await Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'Error al actualizar Gafete',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'alert' }
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: '¿Cancelar cambios?',
      text: 'Los cambios no guardados se perderán.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Continuar editando',
      reverseButtons: true,
      customClass: { popup: 'alert' }
    });

    if (result.isConfirmed) {
      navigate('/tias');
    }
  };

  const handleRemoveFiltro = async () => {
    const result = await Swal.fire({
      title: '¿Quitar Control de acceso asignado?',
      text: `"${tias?.id}" dejará de estar asociado al Control de acceso "${tias?.filtro?.nombre}"`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, quitar Control de acceso',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'alert' }
    });

    if (result.isConfirmed) {
      setFormData(prev => ({
        ...prev,
        filtroId: null
      }));

      await Swal.fire({
        title: 'Control de acceso removido',
        text: 'El Control de acceso ha sido quitado del formulario. Recuerde guardar los cambios.',
        icon: 'info',
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: 'alert' }
      });
    }
  };

  const estaDisponible = tias ? tiasDisponibles.has(tias.id) : false;
  const estadoTexto = estaDisponible ? 'Disponible' : 'En uso';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando gafetes...</div>
      </div>
    );
  }

  if (!tias) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Gafete no encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🏷️ Editar Gafete de visita</h1>
            <p className="text-gray-600 mt-2">Modifique la información del Gafete "{tias.id}"</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del Gafete */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Información del Gafete</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID (solo lectura) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID del Gafete
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {tias.id}
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Gafete *
                  </label>
                  <select
                    value={formData.tipo || ''}
                    onChange={handleTipoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GIA">GIA</option>
                  </select>
                </div>

                {/* Estado (solo lectura) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponibilidad
                  </label>
                  <div className={`w-full px-3 py-2 border rounded-lg text-center font-semibold ${estaDisponible
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                    {estadoTexto}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {estaDisponible ? 'Lista para usar' : 'Actualmente en uso'}
                  </p>
                </div>

                {/* Accesos Asociados */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accesos Asociados
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 text-center">
                    {tias._count?.accesos || 0}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Total de accesos registrados
                  </p>
                </div>

                {/* Control de acceso Asignado */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Control de acceso Asignado
                  </label>
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <select
                      value={formData.filtroId === null ? '' : (formData.filtroId || '')}
                      onChange={handleFiltroChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Sin filtro asignado</option>
                      {filtros.map(filtro => (
                        <option key={filtro.id} value={filtro.id}>
                          {filtro.nombre} {filtro.ubicacion && `- ${filtro.ubicacion}`}
                        </option>
                      ))}
                    </select>

                    {/* Botón para quitar Control de acceso - solo muestra si hay un Control de acceso actual */}
                    {tias.filtroId && (
                      <button
                        type="button"
                        onClick={handleRemoveFiltro}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 whitespace-nowrap text-sm sm:text-base"
                      >
                        Quitar Control de acceso
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    {formData.filtroId === null
                      ? 'El Control de acceso será removido al guardar los cambios'
                      : formData.filtroId && formData.filtroId !== tias.filtroId
                        ? 'Se asignará un nuevo filtro al guardar los cambios'
                        : 'Seleccione "Sin Control de acceso asignado" para remover el Control de acceso actual'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Información del Sistema */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Información del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div><strong>ID:</strong> <span className="font-mono">{tias.id}</span></div>
                <div><strong>Accesos asociados:</strong> {tias._count?.accesos || 0}</div>
                <div><strong>Fecha de creación:</strong> {new Date(tias.fechaCreacion).toLocaleDateString()}</div>
                <div><strong>Última actualización:</strong> {new Date(tias.fechaActualizacion).toLocaleDateString()}</div>
                <div><strong>Control de acceso actual:</strong> {tias.filtro ? tias.filtro.nombre : 'Ninguno'}</div>
                <div><strong>Disponibilidad:</strong>
                  <span className={`ml-1 px-2 py-1 text-xs font-semibold rounded-full ${estaDisponible
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                    }`}>
                    {estadoTexto}
                  </span>
                </div>
              </div>
            </div>

            {/* Resumen de Cambios */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="text-sm font-semibold text-yellow-800 mb-2">📝 Resumen de Cambios</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                {formData.tipo !== tias.tipo && (
                  <li>• <strong>Tipo:</strong> {tias.tipo} → {formData.tipo}</li>
                )}
                {formData.filtroId === null && tias.filtroId && (
                  <li>• <strong>Filtro:</strong> Se removerá el Control de acceso "{tias.filtro?.nombre}"</li>
                )}
                {formData.filtroId && formData.filtroId !== tias.filtroId && (
                  <li>• <strong>Filtro:</strong> {tias.filtro?.nombre || 'Ninguno'} → {filtros.find(f => f.id === formData.filtroId)?.nombre}</li>
                )}
                {formData.tipo === tias.tipo && formData.filtroId === (tias.filtroId || undefined) && (
                  <li>• No hay cambios pendientes</li>
                )}
              </ul>
            </div>

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !isAdmin}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 order-1 sm:order-2"
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TIASEdit;