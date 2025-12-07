import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Usuario, Acceso, ReporteGlobalResponse, Rol } from '../../types';
import Navbar from '../../components/Navbar';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';

interface UsuarioOperativo {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string | null;
  rol: Rol;
  estaActivo: boolean;
  totalAccesosRegistrados: number;
  accesosActivos: number;
  primeraRegistro: Date | null;
  ultimoRegistro: Date | null;
  areasAtendidas: string[];
  promedioDiario: number;
  registradoPor: string;
}

const ReportePersonas: React.FC = () => {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [usuariosOperativos, setUsuariosOperativos] = useState<UsuarioOperativo[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<UsuarioOperativo[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>('todos');
  const [usuarioSeleccionadoRegistradoPor, setUsuarioSeleccionadoRegistradoPor] = useState<string>('todos');
  const [, setAccesos] = useState<Acceso[]>([]);

  const esSupervisor = usuario?.rol === 'SUPERVISOR';

  useEffect(() => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);

    setFechaInicio(inicio.toISOString().split('T')[0]);
    setFechaFin(fin.toISOString().split('T')[0]);

    fetchDatos(inicio, fin);
  }, []);

  const fetchDatos = async (inicio: Date, fin: Date) => {
    try {
      setLoading(true);

      const usuariosResponse = await api.get('/usuarios');
      const todosUsuarios: Usuario[] = usuariosResponse.data || [];

      const usuariosOperativosData = todosUsuarios.filter(usuario =>
        usuario.rol === 'OPERATIVO'
      );

      // Ajustar fecha fin para incluir TODO el día
      const finAjustado = new Date(fin);
      finAjustado.setHours(23, 59, 59, 999);

      const params: any = {
        fechaInicio: inicio.toISOString(),
        fechaFin: finAjustado.toISOString(),
        incluirEstadisticas: 'true'
      };

      const reporteResponse = await api.get<ReporteGlobalResponse>('/reportes/global', { params });
      const accesosData = reporteResponse.data.success ?
        (reporteResponse.data.datos?.accesos || []) : [];

      setAccesos(accesosData);
      const usuariosConEstadisticas = generarReportePorRegistradoPor(usuariosOperativosData, accesosData, inicio, finAjustado);
      setUsuariosOperativos(usuariosConEstadisticas);
      setUsuariosFiltrados(usuariosConEstadisticas);
      
      // Resetear selección cuando se cargan nuevos datos
      setUsuarioSeleccionado('todos');
      setUsuarioSeleccionadoRegistradoPor('todos');

    } catch (error) {
      console.error('❌ Error fetching report data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los datos del reporte',
        customClass: { popup: "alert" }
      });
    } finally {
      setLoading(false);
    }
  };

  const generarReportePorRegistradoPor = (
    usuariosOperativos: Usuario[],
    accesosData: Acceso[],
    inicio: Date,
    fin: Date
  ): UsuarioOperativo[] => {
    const accesosPorRegistrador = new Map<string, Acceso[]>();

    // Agrupar por registradoPor (campo en el acceso)
    accesosData.forEach(acceso => {
      if (acceso.registradoPor) {
        const registradoPor = acceso.registradoPor.trim();
        if (!accesosPorRegistrador.has(registradoPor)) {
          accesosPorRegistrador.set(registradoPor, []);
        }
        accesosPorRegistrador.get(registradoPor)!.push(acceso);
      } else if (acceso.creador) {
        // Si no hay registradoPor, usar creador
        const nombreCreador = `${acceso.creador.nombre} ${acceso.creador.apellidos}`.trim();
        if (!accesosPorRegistrador.has(nombreCreador)) {
          accesosPorRegistrador.set(nombreCreador, []);
        }
        accesosPorRegistrador.get(nombreCreador)!.push(acceso);
      }
    });

    const usuarios: UsuarioOperativo[] = [];
    let idCounter = 1;

    accesosPorRegistrador.forEach((accesos, registradoPor) => {
      if (accesos.length === 0) return;

      // Buscar usuario correspondiente
      const usuarioEncontrado = usuariosOperativos.find(usuario => {
        const nombreCompleto = `${usuario.nombre} ${usuario.apellidos}`.trim();
        return nombreCompleto === registradoPor ||
          registradoPor.includes(usuario.nombre) ||
          registradoPor.includes(usuario.apellidos);
      });

      // Datos del usuario
      const nombre = usuarioEncontrado?.nombre || registradoPor.split(' ')[0] || 'Desconocido';
      const apellidos = usuarioEncontrado?.apellidos || registradoPor.split(' ').slice(1).join(' ') || '';
      const email = usuarioEncontrado?.email || `${registradoPor.toLowerCase().replace(/\s+/g, '.')}@aifa.com`;
      const telefono = usuarioEncontrado?.telefono || null;
      const rol = usuarioEncontrado?.rol || 'OPERATIVO' as Rol;
      const estaActivo = usuarioEncontrado?.estaActivo ?? true;

      // Cálculos
      const accesosActivos = accesos.filter(acceso => !acceso.horaSalida).length;
      const fechasRegistro = accesos.map(acceso => new Date(acceso.horaEntrada));
      const primeraRegistro = fechasRegistro.length > 0 ?
        new Date(Math.min(...fechasRegistro.map(d => d.getTime()))) : null;
      const ultimoRegistro = fechasRegistro.length > 0 ?
        new Date(Math.max(...fechasRegistro.map(d => d.getTime()))) : null;

      const areasAtendidas = [...new Set(accesos
        .map(acceso => acceso.area)
        .filter((area): area is string => area != null && area.trim() !== '')
      )];

      const diasPeriodo = Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const promedioDiario = diasPeriodo > 0 ? Math.round(accesos.length / diasPeriodo) : 0;

      usuarios.push({
        id: idCounter++,
        nombre,
        apellidos,
        email,
        telefono,
        rol,
        estaActivo,
        totalAccesosRegistrados: accesos.length,
        accesosActivos,
        primeraRegistro,
        ultimoRegistro,
        areasAtendidas,
        promedioDiario,
        registradoPor // Campo clave para exportación
      });
    });

    return usuarios.sort((a, b) => b.totalAccesosRegistrados - a.totalAccesosRegistrados);
  };

  const handleFiltrar = () => {
    if (!fechaInicio || !fechaFin) {
      Swal.fire({
        icon: 'warning',
        title: 'Fechas requeridas',
        text: 'Por favor seleccione ambas fechas',
        customClass: { popup: "alert" }
      });
      return;
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    
    // Ajustar fecha fin para incluir TODO el día
    const finAjustado = new Date(fin);
    finAjustado.setHours(23, 59, 59, 999);

    if (inicio > finAjustado) {
      Swal.fire({
        icon: 'error',
        title: 'Fechas inválidas',
        text: 'La fecha de inicio no puede ser mayor a la fecha fin',
        customClass: { popup: "alert" }
      });
      return;
    }

    fetchDatos(inicio, finAjustado);
  };

  const handleUsuarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valorSeleccionado = e.target.value;
    
    if (valorSeleccionado === 'todos') {
      setUsuarioSeleccionado('todos');
      setUsuarioSeleccionadoRegistradoPor('todos');
      setUsuariosFiltrados(usuariosOperativos);
    } else {
      // Formato: "id|registradoPor"
      const [id, registradoPor] = valorSeleccionado.split('|');
      setUsuarioSeleccionado(id);
      setUsuarioSeleccionadoRegistradoPor(registradoPor);
      
      // Filtrar por registradoPor (no por id)
      const usuarioFiltrado = usuariosOperativos.filter(usuario =>
        usuario.registradoPor === registradoPor
      );
      setUsuariosFiltrados(usuarioFiltrado);
    }
  };

  const handleExportar = async (formato: 'pdf' | 'excel' | 'csv') => {
    try {
      if (!fechaInicio || !fechaFin) {
        Swal.fire({
          icon: 'warning',
          title: 'Fechas requeridas',
          text: 'Por favor seleccione ambas fechas antes de exportar',
          customClass: { popup: "alert" }
        });
        return;
      }

      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      
      // Ajustar fecha fin para exportación
      const finAjustado = new Date(fin);
      finAjustado.setHours(23, 59, 59, 999);

      // 📤 Preparar datos para exportación
      const exportData: any = {
        formato,
        fechaInicio: inicio.toISOString(),
        fechaFin: finAjustado.toISOString(),
        tipoReporte: 'usuarios-operativos'
      };

      // Usar registradoPor para el Control de acceso
      if (usuarioSeleccionadoRegistradoPor !== 'todos') {
        exportData.registradoPor = usuarioSeleccionadoRegistradoPor;
        console.log(`📤 Exportando por registrador: ${usuarioSeleccionadoRegistradoPor}`);
      }

      console.log('📤 Enviando datos para exportación:', exportData);

      const response = await api.post('/reportes/exportar', exportData, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], {
        type: response.headers['content-type']
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      let fileName = '';
      if (usuarioSeleccionadoRegistradoPor === 'todos') {
        fileName = `reporte_todos_usuarios_${fechaInicio}_a_${fechaFin}.${formato === 'excel' ? 'xlsx' : formato}`;
      } else {
        const nombreArchivo = usuarioSeleccionadoRegistradoPor.replace(/\s+/g, '_');
        fileName = `reporte_usuario_${nombreArchivo}_${fechaInicio}_a_${fechaFin}.${formato === 'excel' ? 'xlsx' : formato}`;
      }

      // Intentar obtener nombre del archivo del header
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) fileName = fileNameMatch[1];
      }

      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({
        icon: "success",
        text: `Reporte exportado en formato ${formato.toUpperCase()}`,
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });

    } catch (error: any) {
      console.error(`Error exportando reporte ${formato}:`, error);

      let errorMessage = 'Error al exportar el reporte';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Swal.fire({
        icon: 'error',
        title: 'Exportación Fallida',
        text: errorMessage,
        customClass: { popup: "alert" }
      });
    }
  };

  const totalUsuarios = usuariosOperativos.length;
  const totalAccesosRegistrados = usuariosOperativos.reduce((acc, u) => acc + u.totalAccesosRegistrados, 0);
  const usuariosActivos = usuariosOperativos.filter(u => u.estaActivo).length;
  const maxAccesosUsuario = Math.max(...usuariosOperativos.map(u => u.totalAccesosRegistrados), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Generando reporte...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">👨‍💼 Reporte de Personal Operativo</h1>
              <p className="text-gray-600">Análisis de usuarios que registran accesos al sistema</p>

              {/* Navegación */}
              <div className="mt-4 flex flex-wrap gap-2">
                {/* Solo mostrar el botón de Vista Global si NO es supervisor */}
                {!esSupervisor && (
                  <Link
                    to="/reportes"
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
                  >
                    📊 Vista Global
                  </Link>
                )}
                <Link
                  to="/reportes/filtros"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-white text-blue-600 border border-blue-600 hover:bg-blue-50"
                >
                  🚪 Vista por Control de acceso
                </Link>
                <button className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-500 text-white">
                  👥 Vista por personal
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros de Fecha */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🕐 Rango de Fechas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <button
                onClick={handleFiltrar}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center"
              >
                🔍 Aplicar Filtro
              </button>
            </div>
          </div>
        </div>

        {/* Filtro por Usuario */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Seleccionar Operativo</h3>
          <div className="max-w-md">
            <select
              value={usuarioSeleccionado === 'todos' ? 'todos' : `${usuarioSeleccionado}|${usuarioSeleccionadoRegistradoPor}`}
              onChange={handleUsuarioChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">👥 Todos los operativos</option>
              {usuariosOperativos.map(usuario => (
                <option key={usuario.id} value={`${usuario.id}|${usuario.registradoPor}`}>
                  {usuario.registradoPor} - {usuario.totalAccesosRegistrados} accesos
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-600 mt-2">
              {usuarioSeleccionadoRegistradoPor === 'todos' 
                ? 'Mostrando todos los operativos' 
                : `Filtrando por: ${usuarioSeleccionadoRegistradoPor}`}
            </p>
          </div>
        </div>

        {/* Estadísticas de Personal Operativo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">
              {usuarioSeleccionadoRegistradoPor === 'todos' ? totalUsuarios : usuariosFiltrados.length}
            </div>
            <div className="text-sm text-gray-600">
              {usuarioSeleccionadoRegistradoPor === 'todos' ? 'Operativo' : 'Operativo Seleccionado'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {usuarioSeleccionadoRegistradoPor === 'todos'
                ? totalAccesosRegistrados
                : (usuariosFiltrados[0]?.totalAccesosRegistrados || 0)}
            </div>
            <div className="text-sm text-gray-600">Total Accesos Registrados</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">
              {usuarioSeleccionadoRegistradoPor === 'todos'
                ? usuariosActivos
                : (usuariosFiltrados[0]?.estaActivo ? 1 : 0)}
            </div>
            <div className="text-sm text-gray-600">
              {usuarioSeleccionadoRegistradoPor === 'todos' ? 'Registradores Activos' : 'Estado'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {usuarioSeleccionadoRegistradoPor === 'todos'
                ? maxAccesosUsuario
                : (usuariosFiltrados[0]?.promedioDiario || 0)}
            </div>
            <div className="text-sm text-gray-600">
              {usuarioSeleccionadoRegistradoPor === 'todos' ? 'Máx Accesos' : 'Promedio/Día'}
            </div>
          </div>
        </div>

        {/* Tabla de Usuarios Operativos */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-8">
          <div className="px-6 py-4 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {usuarioSeleccionadoRegistradoPor === 'todos'
                    ? '📋 Lista de Operativos'
                    : `📊 Reporte Individual: ${usuarioSeleccionadoRegistradoPor}`}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Mostrando {usuariosFiltrados.length} de {totalUsuarios} operativos
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Actualizado: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>

          {usuariosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 text-5xl mb-4">📭</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No hay datos disponibles
              </h4>
              <p className="text-gray-600">
                No se encontraron operativos con los filtros aplicados
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Operativo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estadísticas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Áreas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Período
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {usuario.nombre.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {usuario.registradoPor}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {usuario.id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{usuario.email}</div>
                        <div className="text-sm text-gray-500">
                          {usuario.telefono || 'Sin teléfono'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              Total: {usuario.totalAccesosRegistrados}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm text-gray-600">
                              Activos: {usuario.accesosActivos}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {usuario.areasAtendidas.slice(0, 3).map((area, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {area}
                            </span>
                          ))}
                          {usuario.areasAtendidas.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{usuario.areasAtendidas.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {usuario.primeraRegistro?.toLocaleDateString() || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          al {usuario.ultimoRegistro?.toLocaleDateString() || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${usuario.estaActivo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                          }`}>
                          {usuario.estaActivo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Acciones de Exportación */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📤 Exportar Reporte</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleExportar('pdf')}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg flex items-center"
            >
              📊 Exportar a PDF
            </button>
            <button
              onClick={() => handleExportar('excel')}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center"
            >
              📝 Exportar a Excel
            </button>
            <button
              onClick={() => handleExportar('csv')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center"
            >
              💾 Exportar a CSV
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {usuarioSeleccionadoRegistradoPor === 'todos'
              ? 'Se exportarán todos los registradores'
              : `Se exportará solo el registrador: ${usuarioSeleccionadoRegistradoPor}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportePersonas;