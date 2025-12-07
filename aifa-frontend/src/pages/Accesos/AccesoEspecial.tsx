import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { CreateAccesoDto } from '../../types';
import Navbar from '../../components/Navbar';
import { useOrganigrama } from '../../hooks/useOrganigrama';
import Swal from 'sweetalert2';
import LoadingPage from '../../components/LoadingPage';
import { requiereAcompanante } from '../../services/organigrama.service';

const TIPOS_IDENTIFICACION = [
  { value: 'INE', label: 'INE' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'LICENCIA', label: 'Licencia' },
  { value: 'CEDULA', label: 'Cédula' },
  { value: 'OTRO', label: 'Otro' }
] as const;

const AccesoEspecial: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [turnoOperativo, setTurnoOperativo] = useState<any>(null);
  const [filtroOperativo, setFiltroOperativo] = useState<any>(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [tiasDisponibles, setTiasDisponibles] = useState<any[]>([]);
  const [cargandoTIAS, setCargandoTIAS] = useState(false);
  const [, setRequiereAcompananteArea] = useState(true); // Por defecto true para acceso especial

  // Hooks del organigrama para Área de Visita y Escolta
  const organigramaAreaVisita = useOrganigrama();
  const organigramaAcompanante = useOrganigrama();

  const [formData, setFormData] = useState<CreateAccesoDto>({
    nombre: 'ACCESO',
    apellidos: 'ESPECIAL',
    telefono: null,
    empresa: null,
    motivo: '',
    area: '',
    registradoPor: `${usuario?.nombre || ''} ${usuario?.apellidos || ''}`.trim(), // Agregar campo registradoPor
    identificacionId: null,
    creadoPor: usuario?.id || 0,
    turnoId: null,
    filtroId: null,
    tieneAcompanante: true, // Siempre true para acceso especial
    nombreAcompanante: '',
    direccionAcompanante: '',
    conGrupo: false,
    cantidadGrupo: null,
    tiasId: '',
    horaEntrada: new Date()
  });

  const [identificacionData, setIdentificacionData] = useState({
    tipo: 'INE' as 'INE' | 'PASAPORTE' | 'LICENCIA' | 'CEDULA' | 'OTRO',
    numero: ''
  });

  const [sinIdentificacion, setSinIdentificacion] = useState(false);

  useEffect(() => {
    if (usuario?.rol === 'OPERATIVO' && (!usuario?.nombre?.trim() || !usuario?.apellidos?.trim())) {
      navigate('/nombre-ingreso', { replace: true });
    }
  }, [usuario, navigate]);

  useEffect(() => {
    if (usuario?.id) {
      cargarDatosOperativo();
    }
  }, [usuario?.id]);

  // Cargar Gafetes de visitante disponibles cuando cambie el control de acceso
  useEffect(() => {
    if (filtroOperativo?.id) {
      cargarTIASDisponibles();
    } else {
      setTiasDisponibles([]);
      setFormData(prev => ({ ...prev, tiasId: '' }));
    }
  }, [filtroOperativo?.id]);

  // Verificar requerimiento de escolta cuando cambia el área de visita
  useEffect(() => {
    const direccion = organigramaAreaVisita.direccionSeleccionada;
    const subdireccion = organigramaAreaVisita.subdireccionSeleccionada;
    const gerencia = organigramaAreaVisita.gerenciaSeleccionada;

    if (direccion) {
      const requiere = requiereAcompanante(direccion, subdireccion, gerencia);
      setRequiereAcompananteArea(requiere);
    }
  }, [
    organigramaAreaVisita.direccionSeleccionada,
    organigramaAreaVisita.subdireccionSeleccionada,
    organigramaAreaVisita.gerenciaSeleccionada
  ]);

  const cargarDatosOperativo = async () => {
    try {
      setCargandoDatos(true);

      const usuarioResponse = await api.get(`/usuarios/${usuario?.id}`);
      const usuarioData = usuarioResponse.data;

      if (usuarioData.filtroAsignado) {
        setFiltroOperativo(usuarioData.filtroAsignado);
        setFormData(prev => ({
          ...prev,
          filtroId: usuarioData.filtroAsignado.id
        }));
      }

      if (usuarioData.turnosAsignados && usuarioData.turnosAsignados.length > 0) {
        const turnosActivosUsuario = usuarioData.turnosAsignados
          .filter((asignacion: any) => asignacion.turno.estaActivo)
          .map((asignacion: any) => asignacion.turno);

        if (turnosActivosUsuario.length > 0) {
          const turnoActivo = turnosActivosUsuario[0];
          setTurnoOperativo(turnoActivo);
          setFormData(prev => ({
            ...prev,
            turnoId: turnoActivo.id
          }));
        }
      }

    } catch (error) {
      console.error('❌ Error cargando datos del operativo:', error);
    } finally {
      setCargandoDatos(false);
    }
  };

  const cargarTIASDisponibles = async () => {
    if (!filtroOperativo?.id) {
      setTiasDisponibles([]);
      return;
    }

    try {
      setCargandoTIAS(true);

      const response = await api.get(`/tias/disponibles?filtroId=${filtroOperativo.id}`);
      const tias = response.data.tias || [];

      setTiasDisponibles(tias);

    } catch (error) {
      console.error('❌ Error cargando Gafetes de visitante disponibles:', error);
      setTiasDisponibles([]);
    } finally {
      setCargandoTIAS(false);
    }
  };

  const showAlert = (title: string, text: string, icon: 'error' | 'warning' | 'info' | 'success' = 'error') => {
    Swal.fire({
      icon,
      title,
      text,
      timer: 3000,
      timerProgressBar: true,
      customClass: { popup: "alert" }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombreAcompanante?.trim()) {
      showAlert('Error', 'Nombre del escolta es requerido', 'error');
      return;
    }

    // Validación de dirección administrativa del escolta
    const direccionAcompananteCompleta = organigramaAcompanante.getDireccionCompleta();
    if (!direccionAcompananteCompleta) {
      showAlert('Error', 'Debe seleccionar al menos una dirección administrativa para el escolta', 'error');
      return;
    }

    if (!formData.motivo.trim()) {
      showAlert('Error', 'Motivo de la visita es requerido', 'error');
      return;
    }

    // Validar grupo si viene en grupo - convertir a número
    let cantidadGrupoNumero = null;
    if (formData.conGrupo) {
      if (!formData.cantidadGrupo) {
        showAlert('Error', 'Si viene en grupo, debe especificar la cantidad de personas', 'error');
        return;
      }

      // Convertir a número
      cantidadGrupoNumero = parseInt(formData.cantidadGrupo.toString());
      if (isNaN(cantidadGrupoNumero) || cantidadGrupoNumero < 1) {
        showAlert('Error', 'La cantidad de personas en el grupo debe ser un número válido mayor a 0', 'error');
        return;
      }
    }

    // Validar que tenga turno asignado
    if (!formData.turnoId) {
      showAlert('Error', 'No tiene un turno activo asignado. No puede registrar accesos.', 'error');
      return;
    }

    setLoading(true);

    try {
      let identificacionId = null;

      // Crear identificación solo si NO está marcado "sin identificación"
      if (!sinIdentificacion) {
        try {
          if (identificacionData.numero.trim() || identificacionData.tipo !== 'OTRO') {
            const identificacionResponse = await api.post('/identificaciones', {
              tipo: identificacionData.tipo,
              numero: identificacionData.numero.trim() || null,
              vigente: true,
              filtroId: filtroOperativo?.id || null
            });
            identificacionId = identificacionResponse.data.id;
          }
        } catch (error: any) {
          if (error.response?.status === 400) {
            showAlert('Error', 'Ya existe una identificación con este número. Por favor use otro número.', 'error');
            setLoading(false);
            return;
          }
          throw error;
        }
      }

      // Obtener área de visita del organigrama (opcional)
      const areaVisitaCompleta = organigramaAreaVisita.getDireccionCompleta();

      const accesoData: CreateAccesoDto = {
        nombre: 'ACCESO',
        apellidos: 'ESPECIAL',
        telefono: null,
        empresa: null,
        motivo: formData.motivo.trim(),
        area: areaVisitaCompleta || null,
        registradoPor: `${usuario?.nombre || ''} ${usuario?.apellidos || ''}`.trim(),
        identificacionId: identificacionId,
        creadoPor: formData.creadoPor,
        turnoId: formData.turnoId,
        filtroId: formData.filtroId,
        tieneAcompanante: true, 
        nombreAcompanante: formData.nombreAcompanante?.trim() || '',
        direccionAcompanante: organigramaAcompanante.getDireccionCompleta(),
        conGrupo: formData.conGrupo,
        cantidadGrupo: cantidadGrupoNumero,
        tiasId: formData.tiasId?.trim() || null,
        horaEntrada: new Date()
      };

      await api.post('/accesos', accesoData);

      Swal.fire({
        icon: "success",
        text: "Acceso Especial registrado exitosamente",
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });

      navigate('/accesos');
    } catch (error: any) {
      console.error('❌ Error creating acceso especial:', error);
      showAlert('Error', error.response?.data?.error || 'Error al crear acceso especial', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    let finalValue: any = value;
    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }

    if (finalValue === '') {
      if (name === 'tiasId') {
        finalValue = null;
      } else if (name === 'nombreAcompanante') {
        finalValue = '';
      } else if (name === 'cantidadGrupo') {
        finalValue = null;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleIdentificacionChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setIdentificacionData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSinIdentificacionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSinIdentificacion(checked);
    if (checked) {
      setIdentificacionData(prev => ({ ...prev, numero: '' }));
    }
  };

  if (cargandoDatos) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <Navbar />
        <LoadingPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">🎪 Acceso Especial</h1>
            <p className="text-gray-600">Registro para visitas especiales - Solo información del escolta obligatoria</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información de Visita con Organigrama */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-4">🏢 Información de Visita</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de Visita *</label>
                  <textarea
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Describa el motivo de la visita especial..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GAFETES DE VISITANTE
                    {cargandoTIAS && (
                      <span className="ml-2 text-blue-600 text-sm font-normal">
                        (Cargando...)
                      </span>
                    )}
                  </label>
                  <select
                    name="tiasId"
                    value={formData.tiasId || ''}
                    onChange={handleChange}
                    disabled={cargandoTIAS || tiasDisponibles.length === 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <option value="">Seleccione un Gafete de visitante</option>
                    {tiasDisponibles.map((tias) => (
                      <option key={tias.id} value={tias.id}>
                        {tias.id}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-sm">
                    {filtroOperativo ? (
                      <>
                        {tiasDisponibles.length === 0 && !cargandoTIAS && (
                          <span className="text-red-600">No hay Gafetes disponibles</span>
                        )}
                      </>
                    ) : (
                      <span className="text-red-600">No tiene un control de acceso asignado</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Selects del Organigrama para Área de Visita (Opcional) */}
              <div className="space-y-4 mt-4 p-4 bg-green-100 rounded-lg">
                <h4 className="text-md font-semibold text-gray-700">Área a Visitar</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                    <select
                      value={organigramaAreaVisita.direccionSeleccionada}
                      onChange={(e) => {
                        organigramaAreaVisita.setDireccionSeleccionada(e.target.value);
                        organigramaAreaVisita.resetSubdirecciones();
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Seleccione dirección</option>
                      {organigramaAreaVisita.direcciones.map(direccion => (
                        <option key={direccion.value} value={direccion.value}>
                          {direccion.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subdirección - Solo se habilita si hay subdirecciones disponibles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subdirección
                      {organigramaAreaVisita.subdirecciones.length === 0 && (
                        <span className="ml-2 text-gray-500 text-sm">(No disponible)</span>
                      )}
                    </label>
                    <select
                      value={organigramaAreaVisita.subdireccionSeleccionada}
                      onChange={(e) => {
                        organigramaAreaVisita.setSubdireccionSeleccionada(e.target.value);
                        organigramaAreaVisita.resetGerencias();
                      }}
                      disabled={!organigramaAreaVisita.direccionSeleccionada || organigramaAreaVisita.subdirecciones.length === 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">{
                        organigramaAreaVisita.subdirecciones.length === 0 
                          ? "Sin subdirecciones disponibles" 
                          : "Seleccione subdirección"
                      }</option>
                      {organigramaAreaVisita.subdirecciones.map(subdireccion => (
                        <option key={subdireccion.value} value={subdireccion.value}>
                          {subdireccion.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Gerencia - Solo se habilita si hay gerencias disponibles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gerencia
                      {organigramaAreaVisita.gerencias.length === 0 && (
                        <span className="ml-2 text-gray-500 text-sm">(No disponible)</span>
                      )}
                    </label>
                    <select
                      value={organigramaAreaVisita.gerenciaSeleccionada}
                      onChange={(e) => organigramaAreaVisita.setGerenciaSeleccionada(e.target.value)}
                      disabled={!organigramaAreaVisita.subdireccionSeleccionada || organigramaAreaVisita.gerencias.length === 0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">{
                        organigramaAreaVisita.gerencias.length === 0 
                          ? "Sin gerencias disponibles" 
                          : "Seleccione gerencia"
                      }</option>
                      {organigramaAreaVisita.gerencias.map(gerencia => (
                        <option key={gerencia.value} value={gerencia.value}>
                          {gerencia.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Vista previa del área de visita */}
                {organigramaAreaVisita.getDireccionCompleta() && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Área de visita seleccionada:</strong><br />
                      {organigramaAreaVisita.getDireccionCompleta()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Identificación del Visitante */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">🆔 Identificación del Visitante</h3>

              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={sinIdentificacion}
                  onChange={handleSinIdentificacionChange}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  No se dejó identificación en custodia
                </label>
              </div>

              {!sinIdentificacion && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Identificación</label>
                      <select
                        name="tipo"
                        value={identificacionData.tipo}
                        onChange={handleIdentificacionChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {TIPOS_IDENTIFICACION.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Número de Identificación (Opcional)</label>
                      <input
                        type="text"
                        name="numero"
                        value={identificacionData.numero}
                        onChange={handleIdentificacionChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ej. ABC123456XYZ"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Escolta Obligatorio con Organigrama */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-900 mb-4">👥 Escolta (Obligatorio) *</h3>

              <div className="mt-4 space-y-4 p-4 bg-orange-100 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Escolta *</label>
                  <input
                    type="text"
                    name="nombreAcompanante"
                    value={formData.nombreAcompanante || ''}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej. María López Hernández"
                  />
                </div>

                {/* Selects del Organigrama para Escolta */}
                <div className="space-y-4">
                  <h4 className="text-md font-semibold text-gray-700">Ubicacion a la que pertenece el Escolta *</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Dirección */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dirección *</label>
                      <select
                        value={organigramaAcompanante.direccionSeleccionada}
                        onChange={(e) => {
                          organigramaAcompanante.setDireccionSeleccionada(e.target.value);
                          organigramaAcompanante.resetSubdirecciones();
                        }}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Seleccione dirección</option>
                        {organigramaAcompanante.direcciones.map(direccion => (
                          <option key={direccion.value} value={direccion.value}>
                            {direccion.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subdirección - Solo si hay subdirecciones disponibles */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subdirección
                        {organigramaAcompanante.subdirecciones.length === 0 && (
                          <span className="ml-2 text-gray-500 text-sm">(No disponible)</span>
                        )}
                      </label>
                      <select
                        value={organigramaAcompanante.subdireccionSeleccionada}
                        onChange={(e) => {
                          organigramaAcompanante.setSubdireccionSeleccionada(e.target.value);
                          organigramaAcompanante.resetGerencias();
                        }}
                        disabled={!organigramaAcompanante.direccionSeleccionada || organigramaAcompanante.subdirecciones.length === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{
                          organigramaAcompanante.subdirecciones.length === 0 
                            ? "Sin subdirecciones disponibles" 
                            : "Seleccione subdirección"
                        }</option>
                        {organigramaAcompanante.subdirecciones.map(subdireccion => (
                          <option key={subdireccion.value} value={subdireccion.value}>
                            {subdireccion.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Gerencia - Solo si hay gerencias disponibles */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gerencia
                        {organigramaAcompanante.gerencias.length === 0 && (
                          <span className="ml-2 text-gray-500 text-sm">(No disponible)</span>
                        )}
                      </label>
                      <select
                        value={organigramaAcompanante.gerenciaSeleccionada}
                        onChange={(e) => organigramaAcompanante.setGerenciaSeleccionada(e.target.value)}
                        disabled={!organigramaAcompanante.subdireccionSeleccionada || organigramaAcompanante.gerencias.length === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">{
                          organigramaAcompanante.gerencias.length === 0 
                            ? "Sin gerencias disponibles" 
                            : "Seleccione gerencia"
                        }</option>
                        {organigramaAcompanante.gerencias.map(gerencia => (
                          <option key={gerencia.value} value={gerencia.value}>
                            {gerencia.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Vista previa de la dirección del escolta */}
                  {organigramaAcompanante.getDireccionCompleta() && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Ubicacion a la que pertenece el escolta:</strong><br />
                        {organigramaAcompanante.getDireccionCompleta()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Grupo */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">👨‍👩‍👧‍👦 Grupo</h3>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  name="conGrupo"
                  checked={formData.conGrupo}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Viene en grupo
                </label>
              </div>

              {formData.conGrupo && (
                <div className="mt-4 p-4 bg-indigo-100 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad de Personas en el Grupo *</label>
                    <input
                      type="number"
                      name="cantidadGrupo"
                      value={formData.cantidadGrupo || ''}
                      onChange={handleChange}
                      required={formData.conGrupo}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Ej. 5"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Información del Sistema */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Información del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Registrado por:</span>
                    <span className="font-semibold">{usuario?.nombre} {usuario?.apellidos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rol:</span>
                    <span className="font-semibold">{usuario?.rol}</span>
                  </div>
                  {turnoOperativo ? (
                    <div className="flex justify-between">
                      <span>Turno asignado:</span>
                      <span className="font-semibold text-green-600">{turnoOperativo.nombreTurno}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span>Turno asignado:</span>
                      <span className="font-semibold text-red-600">Sin turno activo</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Hora de entrada:</span>
                    <span className="font-semibold">{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha:</span>
                    <span className="font-semibold">{new Date().toLocaleDateString()}</span>
                  </div>
                  {filtroOperativo ? (
                    <div className="flex justify-between">
                      <span>control de acceso asignado:</span>
                      <span className="font-semibold text-blue-600">{filtroOperativo.nombre}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span>control de acceso asignado:</span>
                      <span className="font-semibold text-yellow-600">Sin control de acceso asignado</span>
                    </div>
                  )}
                </div>
              </div>

              {(!turnoOperativo || !filtroOperativo) && (
                <div className="mt-4 p-3 bg-red-100 rounded-lg">
                  <div className="flex items-start">
                    <div className="text-red-600 mr-2 mt-0.5">⚠️</div>
                    <div className="text-sm text-red-800">
                      <strong>Advertencia:</strong> Para registrar accesos debe tener un turno activo y un control de acceso asignado.
                      {!turnoOperativo && " No tiene un turno activo asignado."}
                      {!filtroOperativo && " No tiene un control de acceso asignado."}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/accesos')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !turnoOperativo || !filtroOperativo || !organigramaAcompanante.getDireccionCompleta()}
                className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition duration-200 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🎪</span>
                    Registrar Acceso Especial
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccesoEspecial;