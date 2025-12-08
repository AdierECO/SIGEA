import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import type { Acceso, UpdateAccesoDto } from '../../types';
import Navbar from '../../components/Navbar';
import { useOrganigrama } from '../../hooks/useOrganigrama';
import Swal from 'sweetalert2';
import { requiereAcompanante } from '../../services/organigrama.service';

const TIPOS_IDENTIFICACION = [
  { value: 'INE', label: 'INE' },
  { value: 'PASAPORTE', label: 'Pasaporte' },
  { value: 'LICENCIA', label: 'Licencia' },
  { value: 'CEDULA', label: 'Cédula' },
  { value: 'OTRO', label: 'Otro' }
] as const;

const AccesoEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acceso, setAcceso] = useState<Acceso | null>(null);
  const [turnoOperativo, setTurnoOperativo] = useState<any>(null);
  const [filtroOperativo, setFiltroOperativo] = useState<any>(null);
  const [tiasDisponibles, setTiasDisponibles] = useState<any[]>([]);
  const [cargandoTIAS, setCargandoTIAS] = useState(false);
  const [requiereAcompananteArea, setRequiereAcompananteArea] = useState(false);
  const [proveedorAcompanante, setProveedorAcompanante] = useState('');

  // Hooks del organigrama para Área de Visita y Escolta
  const organigramaAreaVisita = useOrganigrama();
  const organigramaAcompanante = useOrganigrama();

  // Estado para los datos de identificación
  const [identificacionData, setIdentificacionData] = useState({
    tipo: 'INE' as 'INE' | 'PASAPORTE' | 'LICENCIA' | 'CEDULA' | 'OTRO',
    numero: ''
  });

  const [sinIdentificacion, setSinIdentificacion] = useState(false);

  const [formData, setFormData] = useState<UpdateAccesoDto>({
    nombre: '',
    apellidos: '',
    telefono: '',
    empresa: '',
    motivo: '',
    area: '',
    registradoPor: '',
    tiasId: '',
    identificacionId: null,
    turnoId: null,
    filtroId: null,
    tieneAcompanante: false,
    nombreAcompanante: '',
    direccionAcompanante: '',
    conGrupo: false,
    cantidadGrupo: null
  });

  // Determinar si es acceso especial
  const esAccesoEspecial = formData.nombre === "ACCESO" && formData.apellidos === "ESPECIAL";

  useEffect(() => {
    if (usuario?.rol === 'OPERATIVO' && (!usuario?.nombre?.trim() || !usuario?.apellidos?.trim())) {
      navigate('/nombre-ingreso', { replace: true });
    }
  }, [usuario, navigate]);

  useEffect(() => {
    if (usuario?.id) {
      fetchDatos();
    }
  }, [id, usuario?.id]);

  // Cargar Gafetes de visitante disponibles cuando cambie el control de acceso
  useEffect(() => {
    if (filtroOperativo?.id) {
      cargarTIASDisponibles();
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

      // Si el área requiere escolta, forzar el checkbox
      if (requiere) {
        setFormData(prev => ({
          ...prev,
          tieneAcompanante: true
        }));
      }
    }
  }, [
    organigramaAreaVisita.direccionSeleccionada,
    organigramaAreaVisita.subdireccionSeleccionada,
    organigramaAreaVisita.gerenciaSeleccionada
  ]);

  // Función para parsear la dirección completa en partes del organigrama
  const parsearDireccionCompleta = (direccionCompleta: string | null) => {
    if (!direccionCompleta) return { direccion: '', subdireccion: '', gerencia: '', proveedor: '' };

    const partes = direccionCompleta.split(' - ');
    
    // Verificar si es un proveedor
    if (partes[0] === 'Proveedor' && partes.length >= 2) {
      return {
        direccion: 'Proveedor',
        subdireccion: '',
        gerencia: '',
        proveedor: partes.slice(1).join(' - ') // Unir el resto como nombre del proveedor
      };
    }
    
    return {
      direccion: partes[0] || '',
      subdireccion: partes[1] || '',
      gerencia: partes[2] || '',
      proveedor: ''
    };
  };

  // Función para obtener la dirección completa del escolta
  const getDireccionCompletaAcompanante = () => {
    const direccion = organigramaAcompanante.direccionSeleccionada;
    
    if (direccion === 'Provedor' && proveedorAcompanante.trim()) {
      return `Proveedor - ${proveedorAcompanante.trim()}`;
    }
    
    return organigramaAcompanante.getDireccionCompleta();
  };

  const fetchDatos = async () => {
    try {
      setLoading(true);

      // Cargar datos del usuario que edita para obtener su turno y control de acceso
      const [accesoRes, usuarioRes] = await Promise.all([
        api.get(`/accesos/${id}`),
        api.get(`/usuarios/${usuario?.id}`)
      ]);

      const accesoData = accesoRes.data;
      const usuarioData = usuarioRes.data;

      setAcceso(accesoData);

      // Obtener filtro asignado del usuario que edita
      if (usuarioData.filtroAsignado) {
        setFiltroOperativo(usuarioData.filtroAsignado);
      }

      // Obtener turno activo del usuario que edita
      if (usuarioData.turnosAsignados && usuarioData.turnosAsignados.length > 0) {
        const turnosActivosUsuario = usuarioData.turnosAsignados
          .filter((asignacion: any) => asignacion.turno.estaActivo)
          .map((asignacion: any) => asignacion.turno);

        if (turnosActivosUsuario.length > 0) {
          const turnoActivo = turnosActivosUsuario[0];
          setTurnoOperativo(turnoActivo);
        }
      }

      // Llenar el formulario con los datos actuales del acceso
      setFormData({
        nombre: accesoData.nombre || '',
        apellidos: accesoData.apellidos || '',
        telefono: accesoData.telefono || '',
        empresa: accesoData.empresa || '',
        motivo: accesoData.motivo || '',
        area: accesoData.area || '',
        registradoPor: accesoData.registradoPor || '',
        tiasId: accesoData.tiasId || '',
        identificacionId: accesoData.identificacionId || null,
        turnoId: accesoData.turnoId || null,
        filtroId: accesoData.filtroId || null,
        tieneAcompanante: accesoData.tieneAcompanante || false,
        nombreAcompanante: accesoData.nombreAcompanante || '',
        direccionAcompanante: accesoData.direccionAcompanante || '',
        conGrupo: accesoData.conGrupo || false,
        cantidadGrupo: accesoData.cantidadGrupo || null,
      });

      // Llenar datos de identificación si existen
      if (accesoData.identificacion) {
        setIdentificacionData({
          tipo: accesoData.identificacion.tipo || 'INE',
          numero: accesoData.identificacion.numero || ''
        });
        setSinIdentificacion(false);
      } else {
        // Solo permitir "sin identificación" si es acceso especial
        const esEspecial = accesoData.nombre === "ACCESO" && accesoData.apellidos === "ESPECIAL";
        setSinIdentificacion(esEspecial);
        setIdentificacionData({
          tipo: 'INE',
          numero: ''
        });
      }

      // Cargar organigrama para área de visita
      if (accesoData.area) {
        const areaParseada = parsearDireccionCompleta(accesoData.area);
        organigramaAreaVisita.setDireccionSeleccionada(areaParseada.direccion);
        organigramaAreaVisita.setSubdireccionSeleccionada(areaParseada.subdireccion);
        organigramaAreaVisita.setGerenciaSeleccionada(areaParseada.gerencia);
      }

      // Cargar organigrama para escolta
      if (accesoData.direccionAcompanante) {
        const acompananteParseado = parsearDireccionCompleta(accesoData.direccionAcompanante);
        organigramaAcompanante.setDireccionSeleccionada(acompananteParseado.direccion);
        organigramaAcompanante.setSubdireccionSeleccionada(acompananteParseado.subdireccion);
        organigramaAcompanante.setGerenciaSeleccionada(acompananteParseado.gerencia);
        
        // Si es proveedor, cargar el nombre del proveedor
        if (acompananteParseado.direccion === 'Proveedor') {
          setProveedorAcompanante(acompananteParseado.proveedor);
        }
      }

    } catch (error) {
      console.error('❌ Error fetching datos:', error);
      alert('Error al cargar los datos del acceso');
    } finally {
      setLoading(false);
    }
  };

  const cargarTIASDisponibles = async () => {
    if (!filtroOperativo?.id) return;

    try {
      setCargandoTIAS(true);

      const response = await api.get(`/tias/disponibles?filtroId=${filtroOperativo.id}`);
      const tias = response.data.tias || [];

      setTiasDisponibles(tias);

    } catch (error) {
      console.error('❌ Error cargando Gafetes disponibles:', error);
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

    // Validaciones para acceso especial
    if (esAccesoEspecial) {
      if (!formData.motivo?.trim()) {
        showAlert('Error', 'Motivo de visita es requerido', 'error');
        return;
      }

      let cantidadGrupoNumero = null;
      if (formData.conGrupo) {
        if (!formData.cantidadGrupo) {
          showAlert('Error', 'Si viene en grupo, debe especificar la cantidad de personas', 'error');
          return;
        }

        cantidadGrupoNumero = parseInt(formData.cantidadGrupo.toString());
        if (isNaN(cantidadGrupoNumero) || cantidadGrupoNumero < 1) {
          showAlert('Error', 'La cantidad de personas en el grupo debe ser un número válido mayor a 0', 'error');
          return;
        }
      }
    } else {
      if (!formData.nombre?.trim() || !formData.apellidos?.trim()) {
        showAlert('Error', 'Nombre y apellidos son requeridos', 'error');
        return;
      }

      if (!formData.motivo?.trim()) {
        showAlert('Error', 'Motivo de visita es requerido', 'error');
        return;
      }

      if (!formData.tiasId?.trim()) {
        showAlert('Error', 'Gafete de visitante es requerido', 'error');
        return;
      }
    }

    // Validación de área de visita
    const areaVisitaCompleta = organigramaAreaVisita.getDireccionCompleta();
    if (!areaVisitaCompleta) {
      showAlert('Error', 'Debe seleccionar al menos una dirección para el área de visita', 'error');
      return;
    }

    // Validación de escolta - AHORA también verifica si el área lo requiere
    if (requiereAcompananteArea && !formData.tieneAcompanante) {
      showAlert('Error', 'Esta área requiere escolta obligatoriamente', 'error');
      return;
    }

    if (formData.tieneAcompanante) {
      if (!formData.nombreAcompanante?.trim()) {
        showAlert('Error', 'Nombre del escolta es requerido cuando se selecciona "Viene con escolta"', 'error');
        return;
      }

      const direccionAcompananteCompleta = getDireccionCompletaAcompanante();
      if (!direccionAcompananteCompleta) {
        showAlert('Error', 'Debe completar la información de ubicación para el escolta', 'error');
        return;
      }

      // Validación específica para Proveedor
      if (organigramaAcompanante.direccionSeleccionada === 'Proveedor' && !proveedorAcompanante.trim()) {
        showAlert('Error', 'Debe ingresar el nombre de la empresa/proveedor del escolta', 'error');
        return;
      }
    }

    setSaving(true);

    try {
      let identificacionId = null;

      if (!sinIdentificacion) {
        if (acceso?.identificacion?.id) {
          try {
            await api.put(`/identificaciones/${acceso.identificacion.id}`, {
              tipo: identificacionData.tipo,
              numero: identificacionData.numero?.trim() || null,
              vigente: true,
              filtroId: filtroOperativo?.id || null
            });
            identificacionId = acceso.identificacion.id;
          } catch (error: any) {
            if (error.response?.status === 400) {
              showAlert('Error', 'Ya existe una identificación con este número. Por favor use otro número.', 'error');
              setSaving(false);
              return;
            }
            console.error('Error actualizando identificación:', error);
          }
        } else if (identificacionData.numero?.trim() || identificacionData.tipo !== 'OTRO') {
          try {
            const identificacionResponse = await api.post('/identificaciones', {
              tipo: identificacionData.tipo,
              numero: identificacionData.numero?.trim() || null,
              vigente: true,
              filtroId: filtroOperativo?.id || null
            });
            identificacionId = identificacionResponse.data.id;
          } catch (error: any) {
            if (error.response?.status === 400) {
              showAlert('Error', 'Ya existe una identificación con este número. Por favor use otro número.', 'error');
              setSaving(false);
              return;
            }
            throw error;
          }
        }
      } else {
        if (acceso?.identificacion?.id) {
          identificacionId = null;
        }
      }

      const turnoIdFinal = formData.turnoId || turnoOperativo?.id || null;
      const filtroIdFinal = formData.filtroId || filtroOperativo?.id || null;

      const updateData: UpdateAccesoDto = {
        nombre: formData.nombre?.trim(),
        apellidos: formData.apellidos?.trim(),
        telefono: formData.telefono?.trim() || null,
        empresa: formData.empresa?.trim() || null,
        motivo: formData.motivo.trim(),
        area: areaVisitaCompleta,
        registradoPor: acceso?.registradoPor || '',
        tiasId: formData.tiasId?.trim() || null,
        identificacionId: identificacionId,
        turnoId: turnoIdFinal,
        filtroId: filtroIdFinal,
        tieneAcompanante: formData.tieneAcompanante,
        nombreAcompanante: formData.tieneAcompanante ? formData.nombreAcompanante?.trim() || '' : '',
        direccionAcompanante: formData.tieneAcompanante ? getDireccionCompletaAcompanante() : '',
        ...(esAccesoEspecial && {
          conGrupo: formData.conGrupo,
          cantidadGrupo: formData.conGrupo ? parseInt(formData.cantidadGrupo?.toString() || '0') : null
        })
      };

      await api.put(`/accesos/${id}`, updateData);
      Swal.fire({
        icon: "success",
        text: "Acceso actualizado exitosamente",
        title: "Aviso",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "alert" }
      });

      navigate(`/accesos/ver/${id}`);
    } catch (error: any) {
      console.error('❌ Error updating acceso:', error);
      showAlert('Error', error.response?.data?.error || 'Error al actualizar acceso', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    let finalValue: any = value;

    if (type === 'checkbox') {
      finalValue = (e.target as HTMLInputElement).checked;
    }

    if (finalValue === '') {
      if (name === 'telefono' || name === 'empresa' || name === 'tiasId') {
        finalValue = null;
      } else if (name === 'nombreAcompanante' || name === 'direccionAcompanante') {
        finalValue = '';
      } else if (name === 'cantidadGrupo') {
        finalValue = null;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: finalValue
    }));

    if (name === 'nombre' || name === 'apellidos') {
      const nuevoNombre = name === 'nombre' ? value : formData.nombre;
      const nuevosApellidos = name === 'apellidos' ? value : formData.apellidos;

      const esEspecialAhora = nuevoNombre === "ACCESO" && nuevosApellidos === "ESPECIAL";

      if (esEspecialAhora !== esAccesoEspecial) {
        setSinIdentificacion(esEspecialAhora);
      }
    }
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

    if (!esAccesoEspecial && checked) {
      alert('Solo los accesos especiales pueden no tener identificación');
      return;
    }

    setSinIdentificacion(checked);

    setFormData(prev => ({
      ...prev,
      identificacionId: checked ? null : prev.identificacionId
    }));

    if (checked) {
      setIdentificacionData(prev => ({ ...prev, numero: '' }));
    }
  };

  // Manejar cambio del checkbox de escolta
  const handleAcompananteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Si el área requiere escolta, no permitir desmarcar
    if (requiereAcompananteArea && !e.target.checked) {
      showAlert('Advertencia', 'Esta área requiere escolta obligatoriamente', 'warning');
      return;
    }

    const checked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      tieneAcompanante: checked,
      nombreAcompanante: checked ? prev.nombreAcompanante : '',
      direccionAcompanante: checked ? prev.direccionAcompanante : ''
    }));

    if (!checked) {
      organigramaAcompanante.resetOrganigrama();
      setProveedorAcompanante('');
    }
  };

  // Manejar cambio en el input de proveedor
  const handleProveedorAcompananteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProveedorAcompanante(e.target.value);
  };

  // Verificar si la dirección seleccionada para el escolta es "Proveedor"
  const isProveedorSeleccionado = organigramaAcompanante.direccionSeleccionada === 'Proveedor';

  const handleRegistrarSalida = async () => {
    if (window.confirm('¿Registrar salida de esta persona?')) {
      try {
        await api.patch(`/accesos/${id}/salida`);
        showAlert('Éxito', 'Salida registrada exitosamente', 'success');
        navigate(`/accesos/ver/${id}`);
      } catch (error: any) {
        console.error('❌ Error registrando salida:', error);
        showAlert('Error', error.response?.data?.error || 'Error al registrar salida', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando acceso...</div>
        </div>
      </div>
    );
  }

  if (!acceso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Navbar />
        <div className="text-center">
          <div className="text-red-600 text-4xl mb-4">❌</div>
          <div className="text-red-800 font-semibold mb-2">Acceso no encontrado</div>
          <button
            onClick={() => navigate('/accesos')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">✏️ Editar Acceso</h1>
                <p className="text-gray-600">Actualice la información del acceso</p>
              </div>
              {!acceso.horaSalida && (
                <button
                  onClick={handleRegistrarSalida}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-200"
                >
                  🚪 Registrar Salida
                </button>
              )}
            </div>

            <div className="mt-4">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${acceso.horaSalida
                ? 'bg-gray-100 text-gray-800'
                : 'bg-green-100 text-green-800'
                }`}>
                {acceso.horaSalida ? '🔴 FINALIZADO' : '🟢 ACTIVO'}
              </span>
              <span className="ml-2 text-sm text-gray-600">
                {acceso.horaSalida
                  ? `Salida: ${new Date(acceso.horaSalida).toLocaleString()}`
                  : `Entrada: ${new Date(acceso.horaEntrada).toLocaleString()}`
                }
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!esAccesoEspecial && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">👤 Información Personal</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos *</label>
                    <input
                      type="text"
                      name="apellidos"
                      value={formData.apellidos || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Empresa/Institución</label>
                    <input
                      type="text"
                      name="empresa"
                      value={formData.empresa || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-4">🏢 Información de Visita</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de Visita *</label>
                  <textarea
                    name="motivo"
                    value={formData.motivo || ''}
                    onChange={handleChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GAFETES DE VISITANTE *
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
                    {/* Mostrar el gafete de visitante actual como opción adicional si no está en las disponibles */}
                    {acceso.tias && !tiasDisponibles.some(t => t.id === acceso.tiasId) && (
                      <option value={acceso.tiasId!.toString()} selected>
                        {acceso.tiasId}
                      </option>
                    )}
                    {tiasDisponibles.map(tias => (
                      <option key={tias.id} value={tias.id}>
                        {tias.id}
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-sm">
                    {filtroOperativo ? (
                      <>
                        {tiasDisponibles.length === 0 && !cargandoTIAS && (
                          <span className="text-red-600">No hay gafetes de visitante disponibles</span>
                        )}
                      </>
                    ) : (
                      <span className="text-red-600">No tiene un control de acceso asignado</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-4 p-4 bg-green-100 rounded-lg">
                <h4 className="text-md font-semibold text-gray-700">Seleccione el Área a Visitar *</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Dirección */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Dirección *</label>
                    <select
                      value={organigramaAreaVisita.direccionSeleccionada}
                      onChange={(e) => {
                        organigramaAreaVisita.setDireccionSeleccionada(e.target.value);
                        organigramaAreaVisita.resetSubdirecciones();
                      }}
                      required
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

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">🆔 Identificación del Visitante</h3>

              {esAccesoEspecial && (
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={sinIdentificacion}
                    onChange={handleSinIdentificacionChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    El visitante no dejó identificación en custodia
                  </label>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Identificación</label>
                    <select
                      name="tipo"
                      value={identificacionData.tipo}
                      onChange={handleIdentificacionChange}
                      disabled={sinIdentificacion}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:bg-gray-100"
                    >
                      {TIPOS_IDENTIFICACION.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Identificación</label>
                    <input
                      type="text"
                      name="numero"
                      value={identificacionData.numero}
                      onChange={handleIdentificacionChange}
                      disabled={sinIdentificacion}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:bg-gray-100"
                      placeholder={esAccesoEspecial ? "Opcional para acceso especial" : "Ej: ABC123456XYZ"}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-900 mb-4">👥 Escolta</h3>

              {/* Checkbox para escolta */}
              <div className="mb-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="tieneAcompanante"
                    checked={formData.tieneAcompanante}
                    onChange={handleAcompananteChange}
                    disabled={requiereAcompananteArea} // Deshabilitado si es requerido (ya está forzado a true)
                    className={`w-4 h-4 ${requiereAcompananteArea ? 'text-red-600 cursor-not-allowed' : 'text-orange-600'} border-gray-300 rounded focus:ring-orange-500`}
                  />
                  <span className={`text-sm font-medium ${requiereAcompananteArea ? 'text-red-700' : 'text-gray-700'}`}>
                    Viene con escolta
                    {requiereAcompananteArea && ' (Obligatorio)'}
                  </span>
                </label>
              </div>

              {formData.tieneAcompanante && (
                <div className="mt-4 space-y-4 p-4 bg-orange-100 rounded-lg border border-orange-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Escolta *</label>
                    <input
                      type="text"
                      name="nombreAcompanante"
                      value={formData.nombreAcompanante || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Ej: María López Hernández"
                    />
                  </div>

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
                            // Limpiar el proveedor si cambia de dirección
                            setProveedorAcompanante('');
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

                      {/* Condicional: Mostrar input para Proveedor o selects normales */}
                      {isProveedorSeleccionado ? (
                        // Input para nombre de empresa/proveedor
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de Empresa/Proveedor *
                          </label>
                          <input
                            type="text"
                            value={proveedorAcompanante}
                            onChange={handleProveedorAcompananteChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Ej. Constructora ABC S.A. de C.V."
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Ingrese el nombre completo de la empresa o proveedor
                          </p>
                        </div>
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>

                    {getDireccionCompletaAcompanante() && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Ubicacion a la que pertenece el escolta:</strong><br />
                          {getDireccionCompletaAcompanante()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {esAccesoEspecial && (
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
                        placeholder="Ej: 5"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">⚙️ Información del Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Registrado por:</span>
                    <span className="font-semibold">{acceso.registradoPor || 'No registrado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fecha de registro:</span>
                    <span className="font-semibold">{new Date(acceso.fechaCreacion).toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Última actualización:</span>
                    <span className="font-semibold">{new Date(acceso.fechaActualizacion).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Editando ahora por:</span>
                    <span className="font-semibold text-blue-600">{usuario?.nombre} {usuario?.apellidos}</span>
                  </div>
                  {turnoOperativo && (
                    <div className="flex justify-between">
                      <span>Turno del editor:</span>
                      <span className="font-semibold text-green-600">{turnoOperativo.nombreTurno}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate(`/accesos/ver/${id}`)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !organigramaAreaVisita.getDireccionCompleta() || 
                  (formData.tieneAcompanante && !getDireccionCompletaAcompanante()) || 
                  (formData.tieneAcompanante && isProveedorSeleccionado && !proveedorAcompanante.trim())}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition duration-200 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccesoEdit;