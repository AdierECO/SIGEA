import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import type { Usuario, UpdateUsuarioDto } from '../../types';
import Swal from 'sweetalert2';

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [activeTab, setActiveTab] = useState<'perfil' | 'password'>('perfil');

  // Datos del perfil
  const [formData, setFormData] = useState<UpdateUsuarioDto>({
    nombre: '',
    apellidos: '',
    email: '',
    telefono: ''
  });

  // Datos para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    nuevaPassword: '',
    confirmarPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    actual: false,
    nueva: false,
    confirmar: false
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      const response = await api.get('/perfil/mi-perfil');
      const usuarioData = response.data;
      setUsuario(usuarioData);
      setFormData({
        nombre: usuarioData.nombre || '',
        apellidos: usuarioData.apellidos || '',
        email: usuarioData.email || '',
        telefono: usuarioData.telefono || ''
      });
    } catch (error) {
      console.error('Error fetching perfil:', error);
      alert('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones del perfil
    if (!formData.nombre?.trim() || !formData.apellidos?.trim() || !formData.email?.trim()) {
      alert('Nombre, apellidos y email son requeridos');
      return;
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      alert('Email inválido');
      return;
    }

    setSaving(true);

    try {
      await api.put('/perfil/mi-perfil', formData);
      Swal.fire({
        icon: "success",
        text: "Perfil actualizado exitosamente",
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });
      navigate('/perfil');
    } catch (error: any) {
      console.error('Error updating perfil:', error);
      alert(error.response?.data?.error || 'Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones de contraseña
    const newErrors: { [key: string]: string } = {};

    if (!passwordData.passwordActual) {
      newErrors.passwordActual = 'La contraseña actual es requerida';
    }

    if (!passwordData.nuevaPassword) {
      newErrors.nuevaPassword = 'La nueva contraseña es requerida';
    } else if (passwordData.nuevaPassword.length < 6) {
      newErrors.nuevaPassword = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!passwordData.confirmarPassword) {
      newErrors.confirmarPassword = 'Confirma tu nueva contraseña';
    } else if (passwordData.nuevaPassword !== passwordData.confirmarPassword) {
      newErrors.confirmarPassword = 'Las contraseñas no coinciden';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    setErrors({});

    try {
      await api.patch('/perfil/cambiar-password', {
        passwordActual: passwordData.passwordActual,
        nuevaPassword: passwordData.nuevaPassword
      });

      Swal.fire({
        icon: "success",
        text: "Contraseña actualizada exitosamente",
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });
      navigate('/perfil');

      // Limpiar formulario de contraseña
      setPasswordData({
        passwordActual: '',
        nuevaPassword: '',
        confirmarPassword: ''
      });

      setErrors({});

    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      const errorMessage = error.response?.data?.error || 'Error al cambiar contraseña';
      setErrors({ general: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleCancel = () => {
    navigate('/perfil');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-white">Cargando configuración...</div>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">❌</div>
          <div className="text-white font-bold text-xl mb-4">Error al cargar el perfil</div>
          <button
            onClick={() => navigate('/perfil')}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition duration-300"
          >
            Volver al Perfil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-6">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Compacto */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Configuración de Cuenta</h1>
          <p className="text-white/60">Gestiona tu información personal y seguridad</p>
        </div>

        {/* Navegación con Tabs Compactos */}
        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('perfil')}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'perfil'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
          >
            <div className="flex items-center space-x-2">
              <span>👤</span>
              <span>Información Personal</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('password')}
            className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${activeTab === 'password'
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
          >
            <div className="flex items-center space-x-2">
              <span>🔐</span>
              <span>Seguridad</span>
            </div>
          </button>
        </div>

        {/* Contenido Principal - Centrado y Compacto */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            {/* Tab: Información Personal */}
            {activeTab === 'perfil' && (
              <form onSubmit={handleProfileSubmit}>
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-blue-500/20 p-3 rounded-xl">
                      <span className="text-2xl">👤</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">Información Personal</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/60">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          name="nombre"
                          value={formData.nombre || ''}
                          onChange={handleProfileChange}
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                          placeholder="Tu nombre"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/60">
                          Apellidos *
                        </label>
                        <input
                          type="text"
                          name="apellidos"
                          value={formData.apellidos || ''}
                          onChange={handleProfileChange}
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                          placeholder="Tus apellidos"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/60">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ''}
                          onChange={handleProfileChange}
                          required
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                          placeholder="tu.email@ejemplo.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-white/60">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          name="telefono"
                          value={formData.telefono || ''}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-300"
                          placeholder="+52 123 456 7890"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Información de solo lectura */}
                  <div className="bg-white/5 rounded-xl p-4 mt-6 border border-white/10">
                    <h4 className="text-sm font-medium text-white/60 mb-2">Información del Sistema</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/60">Rol:</span>
                        <span className="ml-2 text-white font-medium">{usuario.rol}</span>
                      </div>
                      <div>
                        <span className="text-white/60">Estado:</span>
                        <span className={`ml-2 font-medium ${usuario.estaActivo ? 'text-green-400' : 'text-red-400'
                          }`}>
                          {usuario.estaActivo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-white/10">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition duration-300 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 bg-blue-500 rounded-xl text-white font-medium hover:bg-blue-600 disabled:opacity-50 transition duration-300 flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <span>💾</span>
                          <span>Guardar Cambios</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Tab: Seguridad y Contraseña */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit}>
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="bg-green-500/20 p-3 rounded-xl">
                      <span className="text-2xl">🔐</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">Seguridad y Contraseña</h2>
                  </div>

                  {errors.general && (
                    <div className="mb-4 bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                      <div className="text-red-200 text-sm">{errors.general}</div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Contraseña Actual */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-white/60">
                        Contraseña Actual *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.actual ? "text" : "password"}
                          name="passwordActual"
                          value={passwordData.passwordActual}
                          onChange={handlePasswordChange}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-300 pr-12 ${errors.passwordActual ? 'border-red-400/50' : 'border-white/10'
                            }`}
                          placeholder="Ingresa tu contraseña actual"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('actual')}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/60 hover:text-white transition duration-300"
                        >
                          <span className="text-lg">{showPasswords.actual ? '🙈' : '👁️'}</span>
                        </button>
                      </div>
                      {errors.passwordActual && (
                        <p className="text-red-400 text-xs mt-1">{errors.passwordActual}</p>
                      )}
                    </div>

                    {/* Nueva Contraseña */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-white/60">
                        Nueva Contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.nueva ? "text" : "password"}
                          name="nuevaPassword"
                          value={passwordData.nuevaPassword}
                          onChange={handlePasswordChange}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-300 pr-12 ${errors.nuevaPassword ? 'border-red-400/50' : 'border-white/10'
                            }`}
                          placeholder="Mínimo 6 caracteres"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('nueva')}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/60 hover:text-white transition duration-300"
                        >
                          <span className="text-lg">{showPasswords.nueva ? '🙈' : '👁️'}</span>
                        </button>
                      </div>
                      {errors.nuevaPassword && (
                        <p className="text-red-400 text-xs mt-1">{errors.nuevaPassword}</p>
                      )}
                    </div>

                    {/* Confirmar Contraseña */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-white/60">
                        Confirmar Nueva Contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirmar ? "text" : "password"}
                          name="confirmarPassword"
                          value={passwordData.confirmarPassword}
                          onChange={handlePasswordChange}
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-300 pr-12 ${errors.confirmarPassword ? 'border-red-400/50' : 'border-white/10'
                            }`}
                          placeholder="Repite tu nueva contraseña"
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirmar')}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/60 hover:text-white transition duration-300"
                        >
                          <span className="text-lg">{showPasswords.confirmar ? '🙈' : '👁️'}</span>
                        </button>
                      </div>
                      {errors.confirmarPassword && (
                        <p className="text-red-400 text-xs mt-1">{errors.confirmarPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Recomendaciones de Seguridad */}
                  <div className="bg-green-500/10 rounded-xl p-4 mt-6 border border-green-400/20">
                    <h4 className="text-sm font-bold text-green-300 mb-2 flex items-center space-x-2">
                      <span>💡</span>
                      <span>Recomendaciones de Seguridad</span>
                    </h4>
                    <ul className="text-green-200 text-xs space-y-1">
                      <li className="flex items-center space-x-2">
                        <span>•</span>
                        <span>Usa una combinación de letras, números y símbolos</span>
                      </li>
                      <li className="flex items-center space-x-2">
                        <span>•</span>
                        <span>Evita contraseñas que uses en otros servicios</span>
                      </li>
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => navigate("/perfil")}
                      className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition duration-300 font-medium"
                    >
                      ← Volver
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-3 bg-green-500 rounded-xl text-white font-medium hover:bg-green-600 disabled:opacity-50 transition duration-300 flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Cambiando...</span>
                        </>
                      ) : (
                        <>
                          <span>⚡</span>
                          <span>Cambiar Contraseña</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;