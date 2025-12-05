import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Navbar from '../../components/Navbar';
import Swal from 'sweetalert2';

interface ImportResult {
  success: boolean;
  message: string;
  detalles?: any;
  formato?: string;
}

const ImportarDB: React.FC = () => {
  const { usuario } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importState, setImportState] = useState({
    archivo: null as File | null,
    pasoActual: 1,
    loading: false,
    resultado: null as ImportResult | null
  });
  const [opcionesImport, setOpcionesImport] = useState({
    modo: 'completo' as 'completo' | 'consolidacion' | 'parcial',
    conflictos: 'conservar' as 'conservar' | 'reemplazar' | 'fusionar',
    validarDatos: true,
    crearBackup: true
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      // Validar tipo de archivo
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!['json', 'sql'].includes(extension || '')) {
        alert('❌ Formato de archivo no válido. Use .json, .sql');
        return;
      }

      if (file.size > 100 * 1024 * 1024) { // 100MB límite
        alert('❌ El archivo es demasiado grande. Límite: 100MB');
        return;
      }

      setImportState(prev => ({ ...prev, archivo: file, pasoActual: 2 }));
    }
  };

  const handleOpcionChange = (key: string, value: any) => {
    setOpcionesImport(prev => ({ ...prev, [key]: value }));
  };

  const descargarBackupSQL = async () => {
    try {
      const response = await api.post('/backup/exportar', {
        formato: 'sql',
        incluirDatos: true,
        incluirEstructura: true
      });

      // Crear y descargar archivo SQL
      const sqlContent = typeof response.data.datos === 'string' 
        ? response.data.datos 
        : JSON.stringify(response.data, null, 2);
      
      const blob = new Blob([sqlContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_pre_importacion_${new Date().toISOString().split('T')[0]}.sql`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error generando backup SQL:', error);
      
      // Fallback: intentar generar backup local
      try {
        const [accesosRes, turnosRes, usuariosRes, identificacionesRes] = await Promise.all([
          api.get('/accesos').catch(() => ({ data: [] })),
          api.get('/turnos').catch(() => ({ data: [] })),
          api.get('/usuarios').catch(() => ({ data: [] })),
          api.get('/identificaciones').catch(() => ({ data: [] }))
        ]);

        const backupData = {
          metadata: {
            tipo: 'BACKUP_PRE_IMPORTACION',
            exportadoPor: `${usuario?.nombre} ${usuario?.apellidos}`,
            fechaExportacion: new Date().toISOString(),
            nota: 'Backup automático antes de importación'
          },
          datos: {
            accesos: accesosRes.data || [],
            turnos: turnosRes.data || [],
            usuarios: usuariosRes.data || [],
            identificaciones: identificacionesRes.data || []
          }
        };

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_pre_importacion_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
      } catch (fallbackError) {
        console.error('Error en backup fallback:', fallbackError);
        return false;
      }
    }
  };

  const analizarArchivo = async () => {
    if (!importState.archivo) return;

    setImportState(prev => ({ ...prev, loading: true }));

    // Simular análisis del archivo
    setTimeout(() => {
      setImportState(prev => ({
        ...prev,
        loading: false,
        pasoActual: 3
      }));
    }, 1000);
  };

  const ejecutarImportacion = async () => {
    if (!importState.archivo) return;

    const { isConfirmed } = await Swal.fire({
      title: '¿Importación de BD?',
      text: '¿Está seguro de generar la importación de la base de datos?' + 
            (opcionesImport.crearBackup ? '\n\nSe creará un backup automático antes de proceder.' : ''),
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, importar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      customClass: { popup: "alert" }
    });

    if (!isConfirmed) return;

    setImportState(prev => ({ ...prev, loading: true }));

    try {
      // Paso 1: Crear backup si está activada la opción
      let backupExitoso = true;
      if (opcionesImport.crearBackup) {
        backupExitoso = await descargarBackupSQL();
        
        if (!backupExitoso) {
          const continuarSinBackup = await Swal.fire({
            title: 'Error en Backup',
            text: 'No se pudo crear el backup automático. ¿Desea continuar con la importación?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Continuar sin backup',
            cancelButtonText: 'Cancelar importación',
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#6b7280',
            customClass: { popup: "alert" }
          });

          if (!continuarSinBackup.isConfirmed) {
            setImportState(prev => ({ ...prev, loading: false }));
            return;
          }
        }
      }

      // Paso 2: Proceder con la importación
      const formData = new FormData();
      formData.append('archivo', importState.archivo);
      formData.append('modo', opcionesImport.modo);
      formData.append('conflictos', opcionesImport.conflictos);
      formData.append('validarDatos', opcionesImport.validarDatos.toString());
      formData.append('crearBackup', opcionesImport.crearBackup.toString());

      const response = await api.post('/backup/importar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportState(prev => ({
        ...prev,
        loading: false,
        resultado: {
          success: true,
          message: response.data.message + (backupExitoso ? ' (Backup creado exitosamente)' : ' (Backup no creado)'),
          detalles: response.data.detalles,
          formato: response.data.formato
        }
      }));

      Swal.fire({
        icon: "success",
        text: "Importación realizada exitosamente" + (backupExitoso ? " - Backup descargado" : ""),
        title: "Aviso",
        timer: 3000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });

    } catch (error: any) {
      console.error('Error en importación:', error);
      const errorMessage = error.response?.data?.error || 'Error durante la importación';

      setImportState(prev => ({
        ...prev,
        loading: false,
        resultado: {
          success: false,
          message: errorMessage
        }
      }));
    }
  };

  const resetImport = () => {
    setImportState({
      archivo: null,
      pasoActual: 1,
      loading: false,
      resultado: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getInfoArchivo = () => {
    if (!importState.archivo) return null;

    return {
      nombre: importState.archivo.name,
      tamaño: (importState.archivo.size / (1024 * 1024)).toFixed(2) + ' MB',
      tipo: importState.archivo.type || 'Desconocido',
      ultimaModificacion: new Date(importState.archivo.lastModified).toLocaleString()
    };
  };

  const infoArchivo = getInfoArchivo();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📥 Importar Base de Datos</h1>
          <p className="text-gray-600">Restaurar o consolidar datos en el sistema AIFA</p>
        </div>

        {/* Wizard de Importación */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {/* Progress Bar */}
          <div className="flex justify-between mb-8 relative">
            <div className="absolute top-3 left-0 right-0 h-1 bg-gray-200 -z-10">
              <div
                className="h-1 bg-blue-500 transition-all duration-300"
                style={{ width: `${(importState.pasoActual / 3) * 100}%` }}
              ></div>
            </div>
            {[1, 2, 3].map(paso => (
              <div key={paso} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${importState.pasoActual >= paso ? 'bg-blue-500' : 'bg-gray-300'
                  }`}>
                  {paso}
                </div>
                <span className="text-sm mt-2">
                  {paso === 1 && 'Seleccionar Archivo'}
                  {paso === 2 && 'Configurar'}
                  {paso === 3 && 'Importar'}
                </span>
              </div>
            ))}
          </div>

          {/* Paso 1: Selección de Archivo */}
          {importState.pasoActual === 1 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Seleccionar Archivo de Backup</h3>
              <p className="text-gray-600 mb-6">Seleccione el archivo de respaldo para importar</p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.sql"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg text-lg"
              >
                📂 Seleccionar Archivo
              </button>

              <div className="mt-4 text-sm text-gray-500">
                Formatos soportados: .json, .sql (hasta 100MB)
              </div>
            </div>
          )}

          {/* Paso 2: Configuración */}
          {importState.pasoActual === 2 && infoArchivo && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Configurar Importación</h3>

              {/* Información del Archivo */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">📄 Archivo Seleccionado</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Nombre:</strong> {infoArchivo.nombre}</div>
                  <div><strong>Tamaño:</strong> {infoArchivo.tamaño}</div>
                  <div><strong>Tipo:</strong> {infoArchivo.tipo}</div>
                  <div><strong>Modificado:</strong> {infoArchivo.ultimaModificacion}</div>
                </div>
              </div>

              {/* Opciones de Importación */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modo de Importación</label>
                  <select
                    value={opcionesImport.modo}
                    onChange={(e) => handleOpcionChange('modo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="completo">Restauración Completa</option>
                    <option value="consolidacion">Consolidación de Datos</option>
                    <option value="parcial">Importación Parcial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manejo de Conflictos</label>
                  <select
                    value={opcionesImport.conflictos}
                    onChange={(e) => handleOpcionChange('conflictos', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="conservar">Conservar datos existentes</option>
                    <option value="reemplazar">Reemplazar con datos nuevos</option>
                    <option value="fusionar">Fusionar datos</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={opcionesImport.validarDatos}
                      onChange={(e) => handleOpcionChange('validarDatos', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Validar integridad de datos antes de importar</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={opcionesImport.crearBackup}
                      onChange={(e) => handleOpcionChange('crearBackup', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Crear backup automático antes de importar (se descargará un archivo SQL)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setImportState(prev => ({ ...prev, pasoActual: 1 }))}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700"
                >
                  ← Anterior
                </button>
                <button
                  onClick={analizarArchivo}
                  disabled={importState.loading}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                >
                  {importState.loading ? 'Analizando...' : 'Siguiente →'}
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Confirmación e Importación */}
          {importState.pasoActual === 3 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirmar Importación</h3>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="text-yellow-600 text-2xl mr-3">⚠️</div>
                  <div>
                    <h4 className="text-yellow-800 font-semibold">Advertencia Importante</h4>
                    <p className="text-yellow-700 text-sm">
                      Esta acción {opcionesImport.modo === 'completo' ? 'reemplazará' : 'modificará'}
                      los datos existentes en el sistema. 
                      {opcionesImport.crearBackup && ' Se descargará un backup automático antes de proceder.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Resumen de la Importación</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Archivo:</strong> {infoArchivo?.nombre}</div>
                  <div><strong>Modo:</strong> {opcionesImport.modo}</div>
                  <div><strong>Conflictos:</strong> {opcionesImport.conflictos}</div>
                  <div><strong>Validación:</strong> {opcionesImport.validarDatos ? 'Sí' : 'No'}</div>
                  <div><strong>Backup:</strong> {opcionesImport.crearBackup ? 'Sí (se descargará)' : 'No'}</div>
                  <div><strong>Usuario:</strong> {usuario?.nombre} {usuario?.apellidos}</div>
                </div>
              </div>

              {importState.resultado ? (
                <div className={`p-4 rounded-lg mb-6 ${importState.resultado.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                  <div className="flex items-center">
                    <div className={`text-2xl mr-3 ${importState.resultado.success ? 'text-green-600' : 'text-red-600'}`}>
                      {importState.resultado.success ? '✅' : '❌'}
                    </div>
                    <div>
                      <h4 className={`font-semibold ${importState.resultado.success ? 'text-green-800' : 'text-red-800'}`}>
                        {importState.resultado.success ? 'Importación Exitosa' : 'Error en Importación'}
                      </h4>
                      <p className={`text-sm ${importState.resultado.success ? 'text-green-700' : 'text-red-700'}`}>
                        {importState.resultado.message}
                      </p>
                      {importState.resultado.detalles && (
                        <div className="mt-2 text-xs">
                          <strong>Detalles:</strong> {JSON.stringify(importState.resultado.detalles)}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={resetImport}
                    className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    Realizar Nueva Importación
                  </button>
                </div>
              ) : (
                <div className="flex justify-between">
                  <button
                    onClick={() => setImportState(prev => ({ ...prev, pasoActual: 2 }))}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={ejecutarImportacion}
                    disabled={importState.loading}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50 flex items-center"
                  >
                    {importState.loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {opcionesImport.crearBackup ? 'Creando Backup...' : 'Importando...'}
                      </>
                    ) : (
                      '🚀 Ejecutar Importación'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Información Adicional */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Información Importante</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span><strong>Backup automático:</strong> Si está activado, se descargará un archivo SQL con todos los datos actuales antes de importar</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>La importación completa reemplazará todos los datos existentes</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>La consolidación fusiona datos de múltiples fuentes</span>
            </div>
            <div className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span>Verifique la procedencia del archivo antes de importar</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportarDB;