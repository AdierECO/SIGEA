import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingPage from '../../components/LoadingPage';

const NombreIngreso: React.FC = () => {
  const { usuario, updateUsuario, logout } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [apellidos, setApellidos] = useState(usuario?.apellidos || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Verificar si el usuario ya tiene nombre completo
  useEffect(() => {
    if (usuario?.nombre?.trim() && usuario?.apellidos?.trim()) {
      navigate('/operativo', { replace: true });
    }
  }, [usuario, navigate]);

  // Si no hay usuario, mostrar loading
  if (!usuario) {
    return <LoadingPage />;
  }

  // Validación en tiempo real
  const validateForm = () => {
    const errors: string[] = [];
    const trimmedNombre = nombre.trim();
    const trimmedApellidos = apellidos.trim();

    if (!trimmedNombre) errors.push('El nombre es requerido');
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(trimmedNombre)) 
      errors.push('El nombre solo puede contener letras y espacios');
    else if (trimmedNombre.length < 2) 
      errors.push('El nombre debe tener al menos 2 letras');
    else if (trimmedNombre.length > 50) 
      errors.push('El nombre no puede exceder 50 caracteres');

    if (!trimmedApellidos) errors.push('Los apellidos son requeridos');
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(trimmedApellidos)) 
      errors.push('Los apellidos solo pueden contener letras y espacios');
    else if (trimmedApellidos.length < 2) 
      errors.push('Los apellidos deben tener al menos 2 letras');
    else if (trimmedApellidos.length > 50) 
      errors.push('Los apellidos no pueden exceder 50 caracteres');

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join(', '));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const trimmedNombre = nombre.trim();
      const trimmedApellidos = apellidos.trim();

      // 1. Actualizar en el backend
      await api.put(`/usuarios/${usuario.id}`, {
        nombre: trimmedNombre,
        apellidos: trimmedApellidos
      });

      // 2. Actualizar en el contexto inmediatamente
      updateUsuario({
        nombre: trimmedNombre,
        apellidos: trimmedApellidos
      });

      setSuccess('Nombre registrado correctamente. Redirigiendo...');
      
      // 3. Redirigir después de 1.5 segundos
      setTimeout(() => {
        navigate('/operativo', { replace: true });
      }, 1500);

    } catch (error: any) {
      console.error('Error al actualizar nombre:', error);
      
      if (error.response?.status === 403) {
        setError('No tienes permisos para realizar esta acción');
      } else if (error.response?.status === 400) {
        setError(error.response.data.error || 'Datos inválidos');
      } else if (error.response?.status === 404) {
        setError('Usuario no encontrado');
      } else if (error.response?.status === 401) {
        setError('Tu sesión ha expirado');
        setTimeout(() => navigate('/login'), 2000);
      } else if (!error.response) {
        setError('Error de conexión');
      } else {
        setError('Error al guardar los datos');
      }
    } finally {
      setLoading(false);
    }
  };

  // ⭐ LOGOUT ASYNC ACTUALIZADO
  const handleLogout = async () => {
    try {
      await logout(); // ← Ahora espera a que termine
      navigate('/login');
    } catch (error) {
      console.error('Error en logout:', error);
      navigate('/login'); // Redirigir igualmente
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-3xl text-white">👤</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Registro Obligatorio</h1>
            <p className="text-blue-200 text-sm mb-2">
              Hola, {usuario.email.split('@')[0]}
            </p>
            <div className="inline-flex items-center px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
              <span className="text-sm font-semibold text-blue-300">
                Cuenta compartida - Operativo
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl animate-fade-in">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-200 text-sm">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-xl animate-fade-in">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-green-200 text-sm">{success}</span>
              </div>
              <div className="mt-2">
                <div className="w-full bg-green-500/30 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full animate-pulse" style={{ animationDuration: '1.5s' }}></div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Nombre */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Nombre(s) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
                      setNombre(value);
                      if (error) setError('');
                    }
                  }}
                  required
                  disabled={loading || !!success}
                  className={`block w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50 ${
                    error.includes('nombre') ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder="Ej: Juan Carlos"
                  minLength={2}
                  maxLength={50}
                  autoFocus
                />
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-blue-300">Solo letras y espacios</p>
                <p className={`text-xs ${nombre.length > 45 ? 'text-yellow-300' : 'text-blue-300'}`}>
                  {nombre.length}/50
                </p>
              </div>
            </div>

            {/* Campo Apellidos */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Apellidos *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={apellidos}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
                      setApellidos(value);
                      if (error) setError('');
                    }
                  }}
                  required
                  disabled={loading || !!success}
                  className={`block w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50 ${
                    error.includes('apellidos') ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder="Ej: Pérez López"
                  minLength={2}
                  maxLength={50}
                />
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-blue-300">Solo letras y espacios</p>
                <p className={`text-xs ${apellidos.length > 45 ? 'text-yellow-300' : 'text-blue-300'}`}>
                  {apellidos.length}/50
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="space-y-3">
              <button 
                type="submit" 
                disabled={loading || !nombre.trim() || !apellidos.trim() || !!success}
                className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </div>
                ) : success ? '¡Actualizado!' : 'Continuar al Panel Operativo'}
              </button>

              <button 
                type="button"
                onClick={handleLogout}
                disabled={loading}
                className="w-full py-3 px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 font-medium rounded-xl transition duration-200 disabled:opacity-50 group"
              >
                <div className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar Sesión
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-blob { animation: blob 7s infinite; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default NombreIngreso;