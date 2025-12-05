import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getEnviroments } from '../../envs/getEnvs';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [intentosRestantes, setIntentosRestantes] = useState<number | null>(null);

  const apiUrl = getEnviroments().apiUrl;
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setIntentosRestantes(null);

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // MANEJO MEJORADO DE ERRORES
        if (response.status === 423) {
          // Usuario bloqueado
          throw new Error(data.error || 'Cuenta temporalmente bloqueada');
        } else if (response.status === 400) {
          // Credenciales inválidas o usuario desactivado
          const mensajeError = data.error || 'Credenciales incorrectas';
          
          // Extraer intentos restantes del mensaje si existe
          const intentosMatch = mensajeError.match(/Le quedan (\d+) intentos/);
          if (intentosMatch) {
            setIntentosRestantes(parseInt(intentosMatch[1]));
          }
          
          throw new Error(mensajeError);
        } else {
          throw new Error(data.error || 'Error al iniciar sesión');
        }
      }

      // LOGIN EXITOSO
      login(data.token, data.usuario);
      
      // Redirigir según el rol del usuario
      const userRole = data.usuario.rol;
      switch (userRole) {
        case 'SUPERADMIN':
          navigate('/superadmin');
          break;
        case 'ADMINISTRADOR':
          navigate('/admin');
          break;
        case 'SUPERVISOR':
          navigate('/supervisor');
          break;
        case 'OPERATIVO':
          navigate('/operativo');
          break;
        default:
          navigate('/dashboard');
      }
      
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN PARA LIMPIAR FORMULARIO
  const limpiarFormulario = () => {
    setEmail('');
    setPassword('');
    setError('');
    setIntentosRestantes(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Tarjeta de Login */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 transform transition-all duration-300 hover:shadow-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Sistema de Accesos</h1>
            <p className="text-blue-200 text-sm">Aeropuerto Internacional Felipe Ángeles</p>
          </div>

          {/* Mensaje de Error Mejorado */}
          {error && (
            <div className={`mb-6 p-4 rounded-xl backdrop-blur-sm border ${
              error.includes('bloqueada') 
                ? 'bg-orange-500/20 border-orange-500/30' 
                : 'bg-red-500/20 border-red-500/30'
            }`}>
              <div className="flex items-start">
                <svg className={`w-5 h-5 mt-0.5 mr-2 flex-shrink-0 ${
                  error.includes('bloqueada') ? 'text-orange-400' : 'text-red-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${
                    error.includes('bloqueada') ? 'text-orange-200' : 'text-red-200'
                  }`}>
                    {error}
                  </span>
                  
                  {/* MOSTRAR INTENTOS RESTANTES */}
                  {intentosRestantes !== null && (
                    <div className="mt-2">
                      <div className="flex items-center text-xs">
                        <div className="flex-1 bg-gray-600/50 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              intentosRestantes > 1 ? 'bg-green-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${(intentosRestantes / 3) * 100}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-blue-200 font-medium">
                          {intentosRestantes} intentos restantes
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Email */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                    setIntentosRestantes(null);
                  }}
                  required
                  disabled={loading}
                  className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="usuario@aifa.com"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                    setIntentosRestantes(null);
                  }}
                  required
                  disabled={loading}
                  className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Botón de Login */}
            <div className="space-y-3">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-white font-medium rounded-xl transition duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Iniciando sesión...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span>Acceder al Sistema</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </button>

              {/* BOTÓN PARA LIMPIAR (útil después de errores) */}
              {error && (
                <button 
                  type="button"
                  onClick={limpiarFormulario}
                  className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-blue-200 font-medium rounded-xl transition duration-200"
                >
                  Limpiar formulario
                </button>
              )}
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="text-center">
              <p className="text-blue-300 text-sm">
                ¿Problemas para acceder?{' '}
                <span className="text-blue-200 font-medium">
                  Contacta al administrador del sistema
                </span>
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Estilos CSS para animaciones */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

export default Login;