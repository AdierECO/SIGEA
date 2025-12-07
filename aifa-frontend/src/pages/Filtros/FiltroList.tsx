import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { Filtro, FiltroWithRelations } from '../../types';
import Navbar from '../../components/Navbar';
import Swal from 'sweetalert2';

const FiltroList: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState<(Filtro & FiltroWithRelations)[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const isAdmin = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'SUPERADMIN';

  useEffect(() => {
    fetchFiltros();
  }, []);

  const fetchFiltros = async () => {
    try {
      const response = await api.get('/filtros');
      setFiltros(response.data.filtros);
    } catch (error) {
      console.error('Error fetching filtros:', error);
      alert('Error al cargar los filtros');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/filtros/crear');
  };

  const handleEdit = (id: number) => {
    navigate(`/filtros/editar/${id}`);
  };

  const handleDelete = async (id: number, nombre: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar filtro?',
      text: `¿Estás seguro de eliminar el Control de acceso "${nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      footer: 'Esta acción es permanente y no se puede deshacer.',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      customClass: { popup: 'alert' }
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/filtros/${id}`);

      await Swal.fire({
        title: '¡Eliminado!',
        text: `El Control de acceso "${nombre}" ha sido eliminado exitosamente`,
        icon: 'success',
        confirmButtonColor: '#10b981',
        timer: 2000,
        timerProgressBar: true,
        customClass: {popup: 'alert'}
      });

      fetchFiltros();
    } catch (error: any) {
      console.error('Error deleting Control de acceso:', error);

      await Swal.fire({
        title: 'Error',
        html: `
        <div class="text-left">
          <p>No se pudo eliminar el filtro:</p>
          <p class="mt-1 text-red-600 font-medium">${error.response?.data?.error || 'Error al eliminar el Control de acceso'}</p>
        </div>
      `,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleToggleStatus = async (id: number, nombre: string, currentStatus: boolean) => {
    const action = currentStatus ? 'Desactivar' : 'Activar';
    const result = await Swal.fire({
      title: `¿${action} Control de acceso?`,
      text: `¿Está seguro de ${action} el Control de acceso "${nombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'alert' }
    });
    if (result.isConfirmed) {
      try {
        if (currentStatus) {
          // Desactivar
          await api.put(`/filtros/${id}`, { estaActivo: false });
          Swal.fire({
            icon: "success",
            text: `Control de acceso "${nombre}" desactivado exitosamente`,
            title: "Aviso",
            timer: 2000,
            timerProgressBar: true,
            customClass: { popup: "alert" }
          });
        } else {
          await api.put(`/filtros/${id}`, { estaActivo: true });
          Swal.fire({
            icon: "success",
            text: `Control de acceso "${nombre}" activado exitosamente`,
            title: "Aviso",
            timer: 2000,
            timerProgressBar: true,
            customClass: { popup: "alert" }
          });
        }
        fetchFiltros();
      } catch (error: any) {
        console.error('Error updating Control de acceso status:', error);
        alert(error.response?.data?.error || `Error al ${action} el Control de acceso`);
      }
    }
  };

  const filteredFiltros = filtros.filter(filtro => {
    const matchesSearch = filtro.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filtro.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filtro.ubicacion?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterActive === 'all' ||
      (filterActive === 'active' && filtro.estaActivo) ||
      (filterActive === 'inactive' && !filtro.estaActivo);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Cargando Controles de acceso...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎛️ Gestión de Controles de acceso</h1>
              <p className="text-gray-600 mt-2">Administre los Controles de acceso del sistema</p>
            </div>
            {isAdmin && (
              <button
                onClick={handleCreate}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
              >
                + Crear Control de acceso
              </button>
            )}
          </div>
        </div>

        {/* Filtros de búsqueda */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <input
                type="text"
                placeholder="Buscar por nombre, descripción o ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-500">
                Mostrando {filteredFiltros.length} de {filtros.length} Controles de acceso
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Controles de acceso */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuarios
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accesos
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFiltros.map((filtro) => (
                <tr key={filtro.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{filtro.nombre}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {filtro.descripcion || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {filtro.ubicacion || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${filtro.estaActivo
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                      }`}>
                      {filtro.estaActivo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 text-center">
                      {filtro._count?.usuariosAsignados || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 text-center">
                      {filtro._count?.accesos || 0}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(filtro.id)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded text-sm font-medium"
                        >
                          Editar
                        </button>

                        {filtro.estaActivo ? (
                          <button
                            onClick={() => handleToggleStatus(filtro.id, filtro.nombre, true)}
                            className="text-yellow-600 hover:text-yellow-900 bg-yellow-50 hover:bg-yellow-100 px-3 py-1 rounded text-sm font-medium"
                          >
                            Desactivar
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleStatus(filtro.id, filtro.nombre, false)}
                              className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded text-sm font-medium"
                            >
                              Activar
                            </button>
                            <button
                              onClick={() => handleDelete(filtro.id, filtro.nombre)}
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded text-sm font-medium"
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Estado vacío */}
          {filteredFiltros.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎛️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron Controles de acceso</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterActive !== 'all'
                  ? 'Intente ajustar los filtros de búsqueda'
                  : 'No hay filtros registrados en el sistema'
                }
              </p>
              {isAdmin && (
                <button
                  onClick={handleCreate}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  + Crear Primer Control de acceso
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiltroList;