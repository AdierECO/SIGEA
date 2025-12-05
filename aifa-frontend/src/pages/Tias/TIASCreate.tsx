import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { CreateTIASDto, FiltroOption } from '../../types';
import Swal from 'sweetalert2';

const TIASCreate: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState<FiltroOption[]>([]);
  const [idSuffix, setIdSuffix] = useState('');
  const [formData, setFormData] = useState<CreateTIASDto>({
    id: '',
    tipo: 'GIA',
    estado: true,
    filtroId: undefined
  });

  useEffect(() => {
    fetchFiltros();
  }, []);

  useEffect(() => {
    // Actualizar ID completo cuando cambia el tipo o el sufijo
    const fullId = idSuffix ? `${formData.tipo}-${idSuffix}` : '';
    setFormData(prev => ({
      ...prev,
      id: fullId
    }));
  }, [formData.tipo, idSuffix]);

  const fetchFiltros = async () => {
    try {
      const response = await api.get('/filtros/activos');
      setFiltros(response.data);
    } catch (error) {
      console.error('Error fetching filtros:', error);
    }
  };

  const handleTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      tipo: value
    }));
  };

  const handleIdSuffixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIdSuffix(e.target.value);
  };

  const handleFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      filtroId: value ? Number(value) : undefined
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id.trim()) {
      await Swal.fire({
        title: 'Error',
        text: 'El ID de la TIA es requerido',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'alert' }
      });
      return;
    }

    if (!idSuffix.trim()) {
      await Swal.fire({
        title: 'Error',
        text: 'Debe especificar el sufijo del ID',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        customClass: { popup: 'alert' }
      });
      return;
    }

    // Validar que el tipo tenga máximo 5 caracteres
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

    setLoading(true);
    try {
      await api.post('/tias', formData);
      await Swal.fire({
        icon: "success",
        text: "TIA creada exitosamente",
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });
      navigate('/tias');
    } catch (error: any) {
      console.error('Error creating TIAS:', error);
      await Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'Error al crear el TIA',
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Header - Manteniendo el diseño original */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🏷️ Crear Nueva TIA</h1>
            <p className="text-gray-600 mt-2">Complete la información para crear una nueva Tarjeta de Identificación de Acceso Seguro</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del TIAS - Manteniendo colores y estructura */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Información de la TIA</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de TIA *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={handleTipoChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GIA">GIA</option>
                    <option value="SGN">SGN</option>
                  </select>
                </div>

                {/* Filtro Asignado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtro Asignado
                  </label>
                  <select
                    value={formData.filtroId || ''}
                    onChange={handleFiltroChange}
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

                {/* ID del TIAS - Se expande a 2 columnas en desktop */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID de la TIA *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium">
                      {formData.tipo}-
                    </span>
                    <input
                      type="text"
                      value={idSuffix}
                      onChange={handleIdSuffixChange}
                      required
                      className="flex-1 min-w-0 block w-full px-3 py-2 rounded-r-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="001, 002, A01, ESPECIAL, etc."
                      maxLength={50}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Sistema - Manteniendo colores y estructura */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Información del Sistema</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div><strong>Estado:</strong> <span className="text-green-600 font-semibold">Activo</span> (por defecto)</div>
                <div><strong>Usuario creador:</strong> {usuario?.nombre} {usuario?.apellidos}</div>
                <div><strong>Rol:</strong> {usuario?.rol}</div>
                <div><strong>Fecha de creación:</strong> {new Date().toLocaleDateString()}</div>
                <div><strong>Accesos asociados:</strong> <span className="text-gray-400">0 (nuevo)</span></div>
              </div>
            </div>

            {/* Acciones - Manteniendo diseño original pero responsivo */}
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
                disabled={loading || !formData.id}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 order-1 sm:order-2"
              >
                {loading ? 'Creando...' : 'Crear TIA'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TIASCreate;