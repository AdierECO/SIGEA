import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Acceso } from '../../types';
import Navbar from '../../components/Navbar';

const IdentificacionesList: React.FC = () => {
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAccesos();
  }, []);

  const fetchAccesos = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/accesos');
      let accesosData: Acceso[] = [];
      
      if (response.data && response.data.accesos && Array.isArray(response.data.accesos)) {
        accesosData = response.data.accesos;
      } else if (Array.isArray(response.data)) {
        accesosData = response.data;
      } else {
        console.warn('⚠️ Estructura inesperada, intentando extraer array...');
        const arrays = Object.values(response.data).filter(item => Array.isArray(item));
        accesosData = arrays.length > 0 ? arrays[0] : [];
      }
      
      // Mostrar TODOS los accesos con identificación (activos y finalizados)
      const accesosConIdentificacion = accesosData.filter(acceso => 
        acceso.identificacion !== null
      );
      
      setAccesos(accesosConIdentificacion);
      
    } catch (error: any) {
      console.error('❌ Error fetching accesos:', error);
      setAccesos([]);
    } finally {
      setLoading(false);
    }
  };

  const getTiempoRetencion = (acceso: Acceso) => {
    if (!acceso || !acceso.horaEntrada) return null;
    
    const inicio = new Date(acceso.horaEntrada);
    const fin = acceso.horaSalida ? new Date(acceso.horaSalida) : new Date();
    const diffMs = fin.getTime() - inicio.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} día${days > 1 ? 's' : ''} ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Filtrar accesos basado en la búsqueda
  const filteredAccesos = accesos.filter(acceso => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      acceso.nombre?.toLowerCase().includes(term) ||
      acceso.apellidos?.toLowerCase().includes(term) ||
      acceso.empresa?.toLowerCase().includes(term) ||
      acceso.identificacion?.tipo.toLowerCase().includes(term) ||
      acceso.identificacion?.numero?.toLowerCase().includes(term) ||
      acceso.area?.toLowerCase().includes(term)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando identificaciones...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Navbar/>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">📋 Historial de Identificaciones</h1>
          <p className="text-gray-600">Lista completa de identificaciones registradas en el sistema</p>
          <div className="mt-2 text-sm text-gray-600">
            {accesos.length} identificación(es) en total
          </div>
        </div>

        {/* Barra de Búsqueda */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar identificaciones
              </label>
              <input
                type="text"
                id="search"
                placeholder="Buscar por nombre, apellido, empresa, tipo de ID, área..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 mt-4 sm:mt-6">
              <button 
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Limpiar
              </button>
              <button 
                onClick={fetchAccesos}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                🔄 Actualizar
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Busca por: nombre, apellidos, empresa, tipo de identificación, número de ID o área de visita
          </p>
        </div>

        {/* Resultados de Búsqueda */}
        {searchTerm && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {filteredAccesos.length} resultado(s) para "<span className="font-semibold">{searchTerm}</span>"
            </p>
          </div>
        )}

        {/* Tabla de Identificaciones */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {filteredAccesos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visitante
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Identificación
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Información de Visita
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado / Tiempo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAccesos.map((acceso) => {
                    const tiempoRetencion = getTiempoRetencion(acceso);
                    const estaActivo = !acceso.horaSalida;

                    return (
                      <tr key={acceso.id} className="hover:bg-gray-50 transition-colors">
                        {/* Información del Visitante */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                              estaActivo ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <span className={`font-semibold text-sm ${
                                estaActivo ? 'text-blue-600' : 'text-gray-600'
                              }`}>
                                {acceso.nombre?.charAt(0)}{acceso.apellidos?.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {acceso.nombre} {acceso.apellidos}
                              </div>
                              <div className="text-sm text-gray-500">
                                {acceso.empresa || 'Sin empresa'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Información de la Identificación */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className="font-semibold">{acceso.identificacion?.tipo}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {acceso.identificacion?.numero ? (
                              <span className="font-mono">N°: {acceso.identificacion.numero}</span>
                            ) : (
                              'Sin número'
                            )}
                          </div>
                        </td>

                        {/* Información de la Visita */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">Área:</span> {acceso.area}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            <span className="font-medium">Motivo:</span> {acceso.motivo}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Entrada: {new Date(acceso.horaEntrada).toLocaleString()}
                            {acceso.horaSalida && (
                              <div>Salida: {new Date(acceso.horaSalida).toLocaleString()}</div>
                            )}
                          </div>
                        </td>

                        {/* Estado y Tiempo */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              estaActivo 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-gray-100 text-gray-800 border border-gray-200'
                            }`}>
                              {estaActivo ? '🟢 ACTIVO' : '🔴 FINALIZADO'}
                            </span>
                            <div className="text-sm font-semibold text-gray-900">
                              {tiempoRetencion}
                            </div>
                            <div className="text-xs text-gray-500">
                              {estaActivo ? 'Tiempo en custodia' : 'Tiempo total retenida'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron resultados' : 'No hay identificaciones registradas'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'No se han registrado identificaciones en el sistema'
                }
              </p>
            </div>
          )}
        </div>

        {/* Resumen */}
        {filteredAccesos.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredAccesos.length} de {accesos.length} identificación(es) registradas
            {accesos.length > 0 && (
              <span className="ml-4">
                ({accesos.filter(a => !a.horaSalida).length} activas, {accesos.filter(a => a.horaSalida).length} finalizadas)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentificacionesList;