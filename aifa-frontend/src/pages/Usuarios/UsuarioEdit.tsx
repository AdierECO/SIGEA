import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { Usuario, UpdateUsuarioDto } from '../../types';
import Swal from 'sweetalert2';

const UsuarioEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState<UpdateUsuarioDto>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchUsuario();
  }, [id]);

  const fetchUsuario = async () => {
    try {
      const response = await api.get(`/usuarios/${id}`);
      setUser(response.data);
      setFormData({
        email: response.data.email,
        nombre: response.data.nombre,
        apellidos: response.data.apellidos,
        telefono: response.data.telefono,
        rol: response.data.rol,
        estaActivo: response.data.estaActivo
      });
    } catch (error) {
      console.error('Error fetching usuario:', error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cargar la información del usuario",
        customClass: { popup: "alert" }
      });
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'nombre':
      case 'apellidos':
        if (!value?.trim()) return 'Este campo es requerido';
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) return 'Solo se permiten letras y espacios';
        return '';

      case 'telefono':
        if (value && value.trim() !== '') {
          if (!/^\d+$/.test(value)) return 'Solo se permiten números';
          if (value.length < 8 || value.length > 10) return 'El teléfono debe tener entre 8 y 10 dígitos';
        }
        return '';

      case 'password':
        if (value && value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
        return '';

      case 'email':
        if (!value?.trim()) return 'El email es requerido';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
        return '';

      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const inputValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData({
      ...formData,
      [name]: inputValue
    });

    // Validación en tiempo real
    const error = validateField(name, inputValue);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar campos requeridos
    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.nombre)) {
      newErrors.nombre = 'Solo se permiten letras y espacios';
    }

    if (!formData.apellidos?.trim()) {
      newErrors.apellidos = 'Los apellidos son requeridos';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.apellidos)) {
      newErrors.apellidos = 'Solo se permiten letras y espacios';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.telefono && formData.telefono.trim() !== '') {
      if (!/^\d+$/.test(formData.telefono)) {
        newErrors.telefono = 'Solo se permiten números';
      } else if (formData.telefono.length < 8 || formData.telefono.length > 10) {
        newErrors.telefono = 'El teléfono debe tener entre 8 y 10 dígitos';
      }
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "Formulario inválido",
        text: "Por favor, corrija los errores en el formulario",
        customClass: { popup: "alert" }
      });
      return;
    }

    setSaving(true);

    try {
      // Si la contraseña está vacía, no la enviamos
      const dataToSend = { ...formData };
      if (!dataToSend.password) {
        delete dataToSend.password;
      }

      await api.put(`/usuarios/${id}`, dataToSend);
      Swal.fire({
        icon: "success",
        text: "Usuario actualizado exitosamente",
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });
      navigate('/usuarios');
    } catch (error: any) {
      console.error('Error updating usuario:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar usuario';
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        customClass: { popup: "alert" }
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Usuario no encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">✏️ Editar Usuario</h1>
            <p className="text-gray-600">Modifique la información del usuario</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre || ''}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ingrese solo letras"
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellidos *
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos || ''}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.apellidos ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ingrese solo letras"
                />
                {errors.apellidos && (
                  <p className="mt-1 text-sm text-red-600">{errors.apellidos}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                name="password"
                value={formData.password || ''}
                onChange={handleChange}
                placeholder="Dejar en blanco para mantener la actual"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Mínimo 6 caracteres. Solo se actualizará si se ingresa una nueva contraseña.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono || ''}
                onChange={handleChange}
                maxLength={10}
                minLength={8}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.telefono ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="8-10 dígitos"
              />
              {errors.telefono && (
                <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <select
                  name="rol"
                  value={formData.rol || ''}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OPERATIVO">OPERATIVO</option>
                  <option value="SUPERVISOR">SUPERVISOR</option>
                  {usuario?.rol === 'SUPERADMIN' && (
                    <>
                      <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                      <option value="SUPERADMIN">SUPERADMIN</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="estaActivo"
                  checked={formData.estaActivo ?? true}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Usuario activo</label>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/usuarios')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
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

export default UsuarioEdit;