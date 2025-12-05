import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Swal from 'sweetalert2';
import Navbar from '../../components/Navbar';

interface Estadisticas {
  totalRegistros: number;
  totalAccesos: number;
  totalTurnos: number;
  totalUsuarios: number;
  totalIdentificaciones: number;
  totalBackups: number;
  tamanoEstimado: string;
  ultimoBackup: string | null;
}

interface BackupLog {
  id: number;
  tipo: string;
  descripcion: string;
  fechaCreacion: string;
  usuario: {
    nombre: string;
    apellidos: string;
    email: string;
  };
}

const ExportarDB: React.FC = () => {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    formato: 'json' as 'json' | 'sql',
    incluirDatos: true,
    incluirEstructura: true,
    fechaInicio: '',
    fechaFin: ''
  });
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalRegistros: 0,
    totalAccesos: 0,
    totalTurnos: 0,
    totalUsuarios: 0,
    totalIdentificaciones: 0,
    totalBackups: 0,
    tamanoEstimado: '0 MB',
    ultimoBackup: null
  });
  const [historial, setHistorial] = useState<BackupLog[]>([]);

  useEffect(() => {
    fetchEstadisticas();
    fetchHistorial();
  }, []);

  const fetchEstadisticas = async () => {
    try {
      const response = await api.get('/backup/estadisticas');
      setEstadisticas(response.data);
    } catch (error) {
      console.error('Error fetching estadísticas:', error);
      // Fallback a cálculo local si el endpoint no existe
      calcularEstadisticasLocales();
    }
  };

  const calcularEstadisticasLocales = async () => {
    try {
      const [accesosRes, turnosRes, usuariosRes, identificacionesRes] = await Promise.all([
        api.get('/accesos').catch(() => ({ data: [] })),
        api.get('/turnos').catch(() => ({ data: [] })),
        api.get('/usuarios').catch(() => ({ data: [] })),
        api.get('/identificaciones').catch(() => ({ data: [] }))
      ]);

      const totalAccesos = accesosRes.data.length || 0;
      const totalTurnos = turnosRes.data.length || 0;
      const totalUsuarios = usuariosRes.data.length || 0;
      const totalIdentificaciones = identificacionesRes.data.length || 0;
      
      const totalRegistros = totalAccesos + totalTurnos + totalUsuarios + totalIdentificaciones;
      const tamanoEstimado = (totalRegistros * 0.5 / 1024).toFixed(2);

      setEstadisticas(prev => ({
        ...prev,
        totalRegistros,
        totalAccesos,
        totalTurnos,
        totalUsuarios,
        totalIdentificaciones,
        tamanoEstimado: `${tamanoEstimado} MB`
      }));
    } catch (error) {
      console.error('Error calculando estadísticas locales:', error);
    }
  };

  const fetchHistorial = async () => {
    try {
      const response = await api.get('/backup/historial?limit=5&tipo=EXPORTACION');
      setHistorial(response.data.logs);
    } catch (error) {
      console.error('Error fetching historial:', error);
      // Si no hay historial del backend, usar localStorage como fallback
      const ultimoBackup = localStorage.getItem('ultimoBackup');
      if (ultimoBackup) {
        setHistorial([{
          id: 1,
          tipo: 'EXPORTACION',
          descripcion: 'Backup completo del sistema',
          fechaCreacion: ultimoBackup,
          usuario: {
            nombre: usuario?.nombre || 'Usuario',
            apellidos: usuario?.apellidos || '',
            email: usuario?.email || ''
          }
        }]);
      }
    }
  };

  const handleExport = async () => {
    const { isConfirmed } = await Swal.fire({
          title: '¿Exportación de BD?',
          text: '¿Está seguro de generar la exportación de la base de datos?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Sí, exportar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#6b7280',
          customClass: { popup: "alert" }
        });
    
        if  (!isConfirmed) return;

    setLoading(true);
    try {
      const response = await api.post('/backup/exportar', exportOptions);
      
      // Determinar el tipo MIME correcto para la descarga
      let mimeType = 'application/json';
      let fileExtension = 'json';
      
      if (exportOptions.formato === 'sql') {
        mimeType = 'application/sql';
        fileExtension = 'sql';
        
        // Para SQL, descargar como texto plano
        const sqlContent = typeof response.data.datos === 'string' 
          ? response.data.datos 
          : JSON.stringify(response.data, null, 2);
        
        const blob = new Blob([sqlContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_aifa_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Para JSON, descargar normalmente
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { 
          type: mimeType 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_aifa_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Guardar registro local como backup
      localStorage.setItem('ultimoBackup', new Date().toLocaleString());
      
      await fetchEstadisticas();
      await fetchHistorial();

      Swal.fire({
            icon: "success",
            text: "Exportación realizada exitosamente",
            title: "Aviso",
            timer: 3000,
            timerProgressBar: true,
            customClass: { popup: "alert" }
          });
    } catch (error: any) {
      console.error('Error en exportación:', error);
      
      // Fallback: exportación local si el backend falla
      if (error.response?.status === 404 || error.response?.status === 500) {
        await exportacionLocal();
      } else {
        const errorMessage = error.response?.data?.error || 'Error al realizar la exportación';
        alert(`❌ ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const exportacionLocal = async () => {
    try {
      // Obtener datos reales para la exportación local
      const [accesosRes, turnosRes, usuariosRes, identificacionesRes] = await Promise.all([
        api.get('/accesos').catch(() => ({ data: [] })),
        api.get('/turnos').catch(() => ({ data: [] })),
        api.get('/usuarios').catch(() => ({ data: [] })),
        api.get('/identificaciones').catch(() => ({ data: [] }))
      ]);

      const exportData = {
        metadata: {
          exportadoPor: `${usuario?.nombre} ${usuario?.apellidos}`,
          fechaExportacion: new Date().toISOString(),
          version: '1.0',
          opciones: exportOptions,
          nota: 'Exportación local (fallback)'
        },
        datos: {
          accesos: accesosRes.data || [],
          turnos: turnosRes.data || [],
          usuarios: usuariosRes.data || [],
          identificaciones: identificacionesRes.data || []
        }
      };

      // Crear y descargar archivo
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_aifa_local_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Guardar registro local
      localStorage.setItem('ultimoBackup', new Date().toLocaleString());
      await fetchHistorial();
      Swal.fire({
            icon: "success",
            text: "Exportación local completada correctamente (modo fallback)",
            title: "Aviso",
            timer: 2000,
            timerProgressBar: true,
            customClass: { popup: "alert" }
          });
    } catch (fallbackError) {
      console.error('Error en exportación local:', fallbackError);
      alert('❌ Error al realizar la exportación');
    }
  };

  const handleOptionChange = (key: string, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleString('es-ES');
    } catch (error) {
      return fecha;
    }
  };

  const getUltimoBackup = () => {
    if (estadisticas.ultimoBackup) {
      return formatFecha(estadisticas.ultimoBackup);
    }
    if (historial.length > 0) {
      return formatFecha(historial[0].fechaCreacion);
    }
    const localBackup = localStorage.getItem('ultimoBackup');
    return localBackup || 'Nunca';
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'EXPORTACION':
        return 'bg-green-100 text-green-800';
      case 'IMPORTACION':
        return 'bg-blue-100 text-blue-800';
      case 'BACKUP_AUTO':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Navbar/>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">💾 Exportar Base de Datos</h1>
          <p className="text-gray-600">Generar respaldo completo del sistema AIFA</p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{estadisticas.totalRegistros}</div>
            <div className="text-sm text-gray-600">Total Registros</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{estadisticas.tamanoEstimado}</div>
            <div className="text-sm text-gray-600">Tamaño Estimado</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">{getUltimoBackup()}</div>
            <div className="text-sm text-gray-600">Último Backup</div>
          </div>
        </div>

        {/* Opciones de Exportación */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Opciones de Exportación</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Formato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Exportación</label>
              <select
                value={exportOptions.formato}
                onChange={(e) => handleOptionChange('formato', e.target.value as 'json' | 'sql')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="json">JSON (Intercambio de datos)</option>
                <option value="sql">SQL (Base de datos)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {exportOptions.formato === 'json' 
                  ? 'Ideal para migraciones y análisis de datos' 
                  : 'Ideal para respaldo completo de la base de datos'}
              </p>
            </div>

            {/* Rango de Fechas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rango de Fechas (Opcional)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={exportOptions.fechaInicio}
                  onChange={(e) => handleOptionChange('fechaInicio', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Fecha inicio"
                />
                <input
                  type="date"
                  value={exportOptions.fechaFin}
                  onChange={(e) => handleOptionChange('fechaFin', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Fecha fin"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Filtra los accesos por rango de fechas específico
              </p>
            </div>
          </div>

          {/* Opciones Adicionales */}
          <div className="mt-4 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.incluirEstructura}
                onChange={(e) => handleOptionChange('incluirEstructura', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Incluir estructura de tablas</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={exportOptions.incluirDatos}
                onChange={(e) => handleOptionChange('incluirDatos', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Incluir datos de registros</span>
            </label>
          </div>
        </div>

        {/* Información de la Exportación */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-blue-800 font-semibold mb-2">📋 Información de la Exportación</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <div><strong>Formato:</strong> {exportOptions.formato.toUpperCase()}</div>
            <div><strong>Incluye:</strong> {exportOptions.incluirEstructura ? 'Estructura' : ''} {exportOptions.incluirDatos ? ' + Datos' : ''}</div>
            <div><strong>Exportado por:</strong> {usuario?.nombre} {usuario?.apellidos}</div>
            {exportOptions.fechaInicio && <div><strong>Desde:</strong> {exportOptions.fechaInicio}</div>}
            {exportOptions.fechaFin && <div><strong>Hasta:</strong> {exportOptions.fechaFin}</div>}
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">🚀 Generar Exportación</h3>
              <p className="text-sm text-gray-600">Esta acción creará un respaldo completo del sistema</p>
            </div>
            <button
              onClick={handleExport}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  💾 Exportar Base de Datos
                </>
              )}
            </button>
          </div>
        </div>

        {/* Historial de Exportaciones */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📜 Historial de Exportaciones</h3>
          <div className="text-sm text-gray-600">
            {historial.length > 0 ? (
              historial.map((log) => (
                <div key={log.id} className="flex justify-between items-center p-3 border-b">
                  <div className="flex-1">
                    <div className="font-medium">{log.descripcion}</div>
                    <div className="text-xs text-gray-500">
                      Por: {log.usuario.nombre} {log.usuario.apellidos}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500">{formatFecha(log.fechaCreacion)}</div>
                    <div className={`px-2 py-1 rounded text-xs ${getTipoColor(log.tipo)}`}>
                      {log.tipo}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="flex justify-between items-center p-3 border-b">
                  <span>Backup completo del sistema</span>
                  <span className="text-gray-500">{getUltimoBackup()}</span>
                </div>
                <div className="text-center py-4 text-gray-500">
                  No hay más exportaciones registradas
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportarDB;