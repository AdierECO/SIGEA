import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { TIASWithRelations } from '../../types';
import Navbar from '../../components/Navbar';
import Swal from 'sweetalert2';

// Interface para la respuesta de Gafete disponibles
interface TIASDisponible {
    id: string;
    tipo: string;
    estado: boolean;
    filtro?: {
        id: number;
        nombre: string;
    };
    _count: {
        accesos: number;
    };
}

const TIASList: React.FC = () => {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [tias, setTias] = useState<TIASWithRelations[]>([]);
    const [tiasDisponibles, setTiasDisponibles] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterFiltro, setFilterFiltro] = useState<string>('all');

    const isAdmin = usuario?.rol === 'ADMINISTRADOR' || usuario?.rol === 'SUPERADMIN';

    useEffect(() => {
        fetchTIAS();
        fetchTIASDisponibles();
    }, []);

    const fetchTIAS = async () => {
        try {
            const response = await api.get('/tias');
            setTias(response.data.tias);
        } catch (error) {
            console.error('Error fetching Gafete:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al cargar los Gafetes',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchTIASDisponibles = async () => {
        try {
            const response = await api.get<{ tias: TIASDisponible[] }>('/tias/disponibles');
            // Especificar explícitamente el tipo genérico del Set
            const disponiblesSet = new Set<string>(
                response.data.tias.map((tia: TIASDisponible) => tia.id)
            );
            setTiasDisponibles(disponiblesSet);
        } catch (error) {
            console.error('Error fetching TIAS disponibles:', error);
            // Si falla, asumimos que ningún Gafete está disponible
            setTiasDisponibles(new Set<string>());
        }
    };

    const handleCreate = () => {
        navigate('/tias/crear');
    };

    const handleCreateRango = () => {
        navigate('/tias/crear-rango');
    };

    const handleEdit = (id: string) => {
        navigate(`/tias/editar/${id}`);
    };

    const handleDelete = async (id: string, tipo: string) => {
        const result = await Swal.fire({
            title: '¿Eliminar Gafete?',
            text: `¿Estás seguro de eliminar "${id}" - ${tipo}?`,
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
            await api.delete(`/tias/${id}`);

            await Swal.fire({
                title: '¡Eliminado!',
                text: `"${id}" ha sido eliminado exitosamente`,
                icon: 'success',
                confirmButtonColor: '#10b981',
                timer: 2000,
                timerProgressBar: true,
                customClass: { popup: 'alert' }
            });

            // Recargar ambos endpoints después de eliminar
            await Promise.all([fetchTIAS(), fetchTIASDisponibles()]);
        } catch (error: any) {
            console.error('Error deleting Gafete:', error);

            await Swal.fire({
                title: 'Error',
                html: `
                    <div class="text-left">
                        <p>No se pudo eliminar TIAS:</p>
                        <p class="mt-1 text-red-600 font-medium">${error.response?.data?.error || 'Error al eliminar Gafete de visita'}</p>
                    </div>
                `,
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    // Función para determinar si un Gafete está disponible (usando el endpoint de disponibles)
    const estaDisponible = (tiasItem: TIASWithRelations) => {
        return tiasDisponibles.has(tiasItem.id);
    };

    // Función para determinar si un Gafete está en uso
    const estaEnUso = (tiasItem: TIASWithRelations) => {
        return !estaDisponible(tiasItem);
    };

    const filteredTIAS = tias.filter(tiasItem => {
        const matchesSearch = tiasItem.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tiasItem.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tiasItem.filtro?.nombre.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFiltro = filterFiltro === 'all' ||
            (filterFiltro === 'sin-filtro' && !tiasItem.filtroId) ||
            tiasItem.filtroId?.toString() === filterFiltro;

        return matchesSearch && matchesFiltro;
    });

    const filtrosUnicos = Array.from(new Set(tias.map(t => t.filtroId).filter(Boolean)));

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-lg">Cargando Gafetes...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">🏷️ Gestión de Gafetes de visita</h1>
                            <p className="text-gray-600 mt-2">Administre las Tarjetas de Identificación de Acceso Seguro</p>
                        </div>
                        {isAdmin && (
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={handleCreateRango}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-semibold"
                                >
                                    + Crear Rango
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
                                >
                                    + Crear Gafete de visita
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Estadísticas Rápidas - Actualizadas con datos reales de disponibilidad */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-blue-600">{tias.length}</div>
                        <div className="text-sm text-gray-600">Total TIAS</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-red-600">
                            {tias.filter(t => estaEnUso(t)).length}
                        </div>
                        <div className="text-sm text-gray-600">En Uso</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-green-600">
                            {tiasDisponibles.size}
                        </div>
                        <div className="text-sm text-gray-600">Disponibles</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-purple-600">
                            {filtrosUnicos.length}
                        </div>
                        <div className="text-sm text-gray-600">Controles de acceso Asignados</div>
                    </div>
                </div>

                {/* Filtros de búsqueda */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
                            <input
                                type="text"
                                placeholder="Buscar por ID, tipo o Control de acceso..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Control de acceso</label>
                            <select
                                value={filterFiltro}
                                onChange={(e) => setFilterFiltro(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Todos los Controles de acceso</option>
                                <option value="sin-filtro">Sin Control de acceso asignado</option>
                                {filtrosUnicos.map(filtroId => {
                                    const filtro = tias.find(t => t.filtroId === filtroId)?.filtro;
                                    return (
                                        <option key={filtroId} value={filtroId!.toString()}>
                                            {filtro?.nombre}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 lg:mt-0 lg:flex lg:items-end lg:justify-end">
                        <div className="text-sm text-gray-500">
                            Mostrando {filteredTIAS.length} de {tias.length} TIAS
                        </div>
                    </div>
                </div>

                {/* Tabla de Gafetes */}
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Disponibilidad
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Control de acceso Asignado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Accesos
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fecha Creación
                                    </th>
                                    {isAdmin && (
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTIAS.map((tiasItem) => {
                                    const disponible = estaDisponible(tiasItem);
                                    const enUso = estaEnUso(tiasItem);

                                    return (
                                        <tr key={tiasItem.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-mono font-medium text-gray-900">{tiasItem.id}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {tiasItem.tipo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${disponible
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {disponible ? 'Disponible' : 'En uso'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">
                                                    {tiasItem.filtro?.nombre ||
                                                        <span className="text-gray-400 italic">Sin asignar</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`text-sm font-medium text-center ${enUso ? 'text-red-600' : 'text-green-600'
                                                    }`}>
                                                    {tiasItem._count?.accesos || 0}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-600">
                                                    {new Date(tiasItem.fechaCreacion).toLocaleDateString()}
                                                </div>
                                            </td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(tiasItem.id)}
                                                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded text-sm font-medium"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(tiasItem.id, tiasItem.tipo)}
                                                            disabled={enUso}
                                                            className={`px-3 py-1 rounded text-sm font-medium ${enUso
                                                                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                                                                    : 'text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100'
                                                                }`}
                                                            title={enUso ? 'No se puede eliminar: TIA en uso' : 'Eliminar TIAS'}
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Estado vacío */}
                    {filteredTIAS.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4">🏷️</div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron Gafetes</h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm || filterFiltro !== 'all'
                                    ? 'Intente ajustar los filtros de búsqueda'
                                    : 'No hay TIAS registrados en el sistema'
                                }
                            </p>
                            {isAdmin && (
                                <div className="flex flex-col sm:flex-row justify-center gap-3">
                                    <button
                                        onClick={handleCreate}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
                                    >
                                        + Crear Primer TIA
                                    </button>
                                    <button
                                        onClick={handleCreateRango}
                                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
                                    >
                                        + Crear por Rango
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TIASList;