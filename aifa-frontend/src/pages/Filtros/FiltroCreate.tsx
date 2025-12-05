import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { CreateFiltroDto } from '../../types';
import Swal from 'sweetalert2';

const FiltroCreate: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateFiltroDto>({
    nombre: '',
    descripcion: '',
    ubicacion: '',
    usuarioCreadorId: usuario?.id
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      await api.post('/filtros', formData);
      Swal.fire({
        icon: "success",
        text: "Filtro creado exitosamente",
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });
      navigate('/filtros');
    } catch (error: any) {
      console.error('Error creating filtro:', error);
      alert(error.response?.data?.error || 'Error al crear el filtro');
    } finally {
      setLoading(false);
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
      customClass: {popup: 'alert'}
    });

    if (result.isConfirmed) {
      navigate('/filtros');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🎛️ Crear Nuevo Filtro</h1>
            <p className="text-gray-600 mt-2">Complete la información para crear un nuevo filtro en el sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Información Básica</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Filtro *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Filtro Principal, Filtro Zona A, etc."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Descripción del propósito y función del filtro..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={formData.ubicacion || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Edificio A, Piso 2, Zona Norte..."
                  />
                </div>
              </div>
            </div>

            {/* Información del Sistema */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-4">Información del Sistema</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <div><strong>Estado:</strong> <span className="text-green-600 font-semibold">Activo</span> (por defecto)</div>
                <div><strong>Usuario creador:</strong> {usuario?.nombre} {usuario?.apellidos}</div>
                <div><strong>Rol:</strong> {usuario?.rol}</div>
                <div><strong>Fecha de creación:</strong> {new Date().toLocaleDateString()}</div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Filtro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FiltroCreate;