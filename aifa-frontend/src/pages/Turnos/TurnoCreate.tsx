import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { CreateTurnoDto, Usuario } from '../../types';
import Swal from 'sweetalert2';

const TurnoCreate: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUsers,] = useState<number[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [formData, setFormData] = useState<CreateTurnoDto>({
    nombreTurno: '',
    horaInicio: new Date(),
    creadoPor: usuario?.id || 0
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get('/usuarios');
      // Filtrar solo usuarios activos con rol SUPERVISOR u OPERATIVO
      const usuariosDisponibles = response.data.filter((u: Usuario) =>
        u.estaActivo && (u.rol === 'SUPERVISOR' || u.rol === 'OPERATIVO')
      );
      setUsuarios(usuariosDisponibles);
    } catch (error) {
      console.error('Error fetching usuarios:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        usuarioIds: selectedUsers
      };

      await api.post('/turnos', payload);
      Swal.fire({
        icon: "success",
        text: "Turno creado exitosamente",
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });
      navigate('/turnos');
    } catch (error) {
      console.error('Error creating turno:', error);
      Swal.fire({
        icon: "error",
        text: "Error al crear el turno",
        title: "Error",
        customClass: { popup: "alert" }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toTimeString().slice(0, 5); // HH:MM
  };

  const parseTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">🕐 Crear Nuevo Turno</h1>
            <p className="text-gray-600 text-sm sm:text-base">Configure un nuevo turno de trabajo y asigne personal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Información del Turno */}
            <div className="bg-blue-50 p-4 sm:p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">⏰ Configuración del Turno</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Turno *
                  </label>
                  <input
                    type="text"
                    value={formData.nombreTurno}
                    onChange={(e) => setFormData({
                      ...formData,
                      nombreTurno: e.target.value
                    })}
                    required
                    placeholder="Ej: Matutino, Vespertino, Nocturno"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Inicio *
                    </label>
                    <input
                      type="time"
                      value={formatTime(formData.horaInicio)}
                      onChange={(e) => setFormData({
                        ...formData,
                        horaInicio: parseTime(e.target.value)
                      })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Fin Estimada
                    </label>
                    <input
                      type="time"
                      onChange={(e) => setFormData({
                        ...formData,
                        horaFin: e.target.value ? parseTime(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Sistema */}
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Información del Sistema</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-gray-600">
                <div><strong>Creado por:</strong> {usuario?.nombre} {usuario?.apellidos}</div>
                <div><strong>Rol:</strong> {usuario?.rol}</div>
                <div><strong>Fecha de creación:</strong> {new Date().toLocaleDateString()}</div>
                <div><strong>Estado inicial:</strong> Activo</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
              <button
                type="button"
                onClick={() => navigate('/turnos')}
                className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm sm:text-base order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.nombreTurno}
                className="px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 text-sm sm:text-base font-medium order-1 sm:order-2"
              >
                {loading ? 'Creando...' : 'Crear Turno'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isSelectOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsSelectOpen(false)}
        />
      )}
    </div>
  );
};

export default TurnoCreate;