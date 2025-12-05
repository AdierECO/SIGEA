import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { CreateTIASRangoDto, FiltroOption } from '../../types';
import Swal from 'sweetalert2';

const TIASCreateRango: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltroOption[]>([]);
  const [formData, setFormData] = useState<CreateTIASRangoDto>({
    inicio: 1,
    fin: 10,
    tipo: 'GIA',
    prefijo: 'GIA-',
    filtroId: undefined
  });

  useEffect(() => {
    fetchFiltros();
  }, []);

  useEffect(() => {
    // Actualizar prefijo automáticamente cuando cambia el tipo
    setFormData(prev => ({
      ...prev,
      prefijo: `${prev.tipo}-`
    }));
  }, [formData.tipo]);

  const fetchFiltros = async () => {
    try {
      const response = await api.get('/filtros/activos');
      setFiltros(response.data);
    } catch (error) {
      console.error('Error fetching filtros:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'inicio' || name === 'fin') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      tipo: value,
      prefijo: `${value}-`
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (formData.inicio > formData.fin) {
      await Swal.fire({
        title: 'Error',
        text: 'El número inicial no puede ser mayor al final',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'alert' }
      });
      return;
    }

    const cantidad = formData.fin - formData.inicio + 1;
    if (cantidad > 1000) {
      await Swal.fire({
        title: 'Error',
        text: 'No se pueden crear más de 2000 TIAS a la vez',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'alert' }
      });
      return;
    }

    if (cantidad <= 0) {
      await Swal.fire({
        title: 'Error',
        text: 'El rango debe contener al menos 1 TIAS',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'alert' }
      });
      return;
    }

    // Confirmación antes de crear
    const result = await Swal.fire({
      title: `¿Crear ${cantidad} TIAS?`,
      html: `
        <div class="text-left">
          <p>Se crearán <strong>${cantidad} TIAS</strong> con las siguientes características:</p>
          <ul class="mt-2 text-sm space-y-1">
            <li>• Tipo: <strong>${formData.tipo}</strong></li>
            <li>• Prefijo: <strong>${formData.prefijo}</strong></li>
            <li>• Rango: <strong>${formData.inicio}</strong> a <strong>${formData.fin}</strong></li>
          </ul>
          <p class="mt-3 text-xs text-gray-600">Esta acción puede tomar unos segundos...</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Sí, crear ${cantidad} TIAS`,
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'alert' }
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const response = await api.post('/tias/rango', formData);

      await Swal.fire({
        title: '¡Éxito!',
        html: `
          <div class="text-left">
            <p>Se han creado <strong>${response.data.detalles.tiasCreados} TIAS</strong> exitosamente:</p>
            <ul class="mt-2 text-sm space-y-1">
              <li>• Solicitados: ${response.data.detalles.totalSolicitados}</li>
              <li>• Creados: <strong class="text-green-600">${response.data.detalles.tiasCreados}</strong></li>
              <li>• Ya existían: <span class="text-yellow-600">${response.data.detalles.existentes}</span></li>
              ${response.data.detalles.idsExistentes.length > 0 ?
            `<li class="text-xs">IDs existentes: ${response.data.detalles.idsExistentes.slice(0, 5).join(', ')}${response.data.detalles.idsExistentes.length > 5 ? '...' : ''}</li>` :
            ''
          }
            </ul>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Ver TIAS',
        confirmButtonColor: '#10b981',
        customClass: { popup: 'alert' }
      });

      navigate('/tias');
    } catch (error: any) {
      console.error('Error creating TIAS por rango:', error);
      await Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'Error al crear los TIAS',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'alert' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: '¿Cancelar creación?',
      text: 'Los datos ingresados se perderán.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Continuar',
      reverseButtons: true,
      customClass: { popup: 'alert' }
    });

    if (result.isConfirmed) {
      navigate('/tias');
    }
  };

  const cantidad = formData.fin - formData.inicio + 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🏷️ Crear TIAS por Rango</h1>
            <p className="text-gray-600 mt-2">Cree múltiples Tarjetas de Identificación de Acceso Seguro de forma masiva</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Configuración del Rango */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Configuración del Rango</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de TIAS *
                  </label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleTipoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GIA">GIA</option>
                    <option value="SGN">SGN</option>
                  </select>
                </div>

                {/* Prefijo del ID (solo informativo) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prefijo del ID
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm font-medium">
                    {formData.prefijo}
                  </div>
                </div>

                {/* Rango Inicio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número Inicial *
                  </label>
                  <input
                    type="number"
                    name="inicio"
                    value={formData.inicio}
                    onChange={handleChange}
                    required
                    min="1"
                    max="9999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Número inicial del rango</p>
                </div>

                {/* Rango Fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número Final *
                  </label>
                  <input
                    type="number"
                    name="fin"
                    value={formData.fin}
                    onChange={handleChange}
                    required
                    min="1"
                    max="2000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Número final del rango</p>
                </div>

                {/* Filtro Asignado */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtro Asignado (opcional)
                  </label>
                  <select
                    name="filtroId"
                    value={formData.filtroId || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin filtro asignado</option>
                    {filtros.map(filtro => (
                      <option key={filtro.id} value={filtro.id}>
                        {filtro.nombre} {filtro.ubicacion && `- ${filtro.ubicacion}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Información del Sistema */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Información del Sistema</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div><strong>Usuario creador:</strong> {usuario?.nombre} {usuario?.apellidos}</div>
                <div><strong>Rol:</strong> {usuario?.rol}</div>
                <div><strong>Fecha de creación:</strong> {new Date().toLocaleDateString()}</div>
                <div><strong>Estado:</strong> <span className="text-green-600 font-semibold">Todos disponibles</span></div>
              </div>
            </div>

            {/* Acciones - Solo responsivo en botones */}
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
                disabled={loading || cantidad <= 0}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 order-1 sm:order-2"
              >
                {loading ? 'Creando...' : `Crear ${cantidad} TIAS`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TIASCreateRango;