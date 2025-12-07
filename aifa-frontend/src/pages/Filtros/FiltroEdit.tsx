import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { UpdateFiltroDto, Filtro, FiltroWithRelations } from '../../types';
import Swal from 'sweetalert2';

const FiltroEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filtro, setFiltro] = useState<(Filtro & FiltroWithRelations) | null>(null);
  const [formData, setFormData] = useState<UpdateFiltroDto>({
    nombre: '',
    descripcion: '',
    ubicacion: '',
    estaActivo: true
  });

  const isAdmin = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'SUPERADMIN';

  useEffect(() => {
    if (id) {
      fetchFiltro();
    }
  }, [id]);

  const fetchFiltro = async () => {
    try {
      const response = await api.get(`/filtros/${id}`);
      setFiltro(response.data);
      setFormData({
        nombre: response.data.nombre,
        descripcion: response.data.descripcion || '',
        ubicacion: response.data.ubicacion || '',
        estaActivo: response.data.estaActivo
      });
    } catch (error) {
      console.error('Error fetching filtro:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Error al cargar el filtro',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
        customClass: { popup: "alert" }
      });
      navigate('/filtros');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nombre?.trim()) {
      alert('El nombre del Control de acceso es requerido');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/filtros/${id}`, formData);
      Swal.fire({
        icon: "success",
        text: "Control de acceso editado exitosamente",
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });
      navigate('/filtros');
    } catch (error: any) {
      console.error('Error updating Control de acceso:', error);
      await Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'Error al actualizar el Control de acceso',
        icon: 'error',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#ef4444',
        customClass: { popup: "alert" }
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
          customClass: {popup: 'alert'}
        });
    
        if (result.isConfirmed) {
          navigate('/filtros');
        }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando Control de acceso...</div>
      </div>
    );
  }

  if (!filtro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Control de acceso no encontrado</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">🎛️ Editar Control de acceso</h1>
            <p className="text-gray-600 mt-2">Modifique la información del Control de acceso "{filtro.nombre}"</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Información Básica</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Control de acceso *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  />
                </div>
              </div>
            </div>

            {/* Información del Sistema */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">Información del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div><strong>ID:</strong> {filtro.id}</div>
                <div><strong>Creado por:</strong> {filtro.usuarioCreador ? `${filtro.usuarioCreador.nombre} ${filtro.usuarioCreador.apellidos}` : 'Sistema'}</div>
                <div><strong>Usuarios asignados:</strong> {filtro._count?.usuariosAsignados || 0}</div>
                <div><strong>Accesos asociados:</strong> {filtro._count?.accesos || 0}</div>
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
                disabled={saving || !isAdmin}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
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

export default FiltroEdit;