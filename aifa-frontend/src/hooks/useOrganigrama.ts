// src/hooks/useOrganigrama.ts
import { useState, useMemo } from 'react';
import { organigrama } from '../data/Organigrama';

export const useOrganigrama = () => {
  const [direccionSeleccionada, setDireccionSeleccionada] = useState<string>('');
  const [subdireccionSeleccionada, setSubdireccionSeleccionada] = useState<string>('');
  const [gerenciaSeleccionada, setGerenciaSeleccionada] = useState<string>('');

  // Obtener direcciones
  const direcciones = useMemo(() =>
    organigrama.map(dir => ({
      value: dir.nombre,
      label: dir.nombre
    })), []);

  // Obtener subdirecciones basadas en la dirección seleccionada
  const subdirecciones = useMemo(() => {
    if (!direccionSeleccionada) return [];

    const direccion = organigrama.find(dir => dir.nombre === direccionSeleccionada);
    // Verificar si existe y tiene subdirecciones
    if (!direccion || !direccion.subdirecciones || direccion.subdirecciones.length === 0) {
      return [];
    }

    return direccion.subdirecciones.map(sub => ({
      value: sub.nombre,
      label: sub.nombre
    })) || [];
  }, [direccionSeleccionada]);

  // Obtener gerencias basadas en la subdirección seleccionada
  const gerencias = useMemo(() => {
    if (!direccionSeleccionada || !subdireccionSeleccionada) return [];

    const direccion = organigrama.find(dir => dir.nombre === direccionSeleccionada);
    if (!direccion || !direccion.subdirecciones) return [];

    const subdireccion = direccion.subdirecciones.find(sub => sub.nombre === subdireccionSeleccionada);
    // Verificar si existe y tiene gerencias
    if (!subdireccion || !subdireccion.gerencias || subdireccion.gerencias.length === 0) {
      return [];
    }

    return subdireccion.gerencias.map(ger => ({
      value: ger.nombre,
      label: ger.nombre
    })) || [];
  }, [direccionSeleccionada, subdireccionSeleccionada]);

  // Función para obtener el valor completo a guardar
  const getDireccionCompleta = (): string => {
    const partes = [];
    if (direccionSeleccionada) partes.push(direccionSeleccionada);
    if (subdireccionSeleccionada) partes.push(subdireccionSeleccionada);
    if (gerenciaSeleccionada) partes.push(gerenciaSeleccionada);

    return partes.join(' - ');
  };

  // Resetear selecciones
  const resetSubdirecciones = () => {
    setSubdireccionSeleccionada('');
    setGerenciaSeleccionada('');
  };

  const resetGerencias = () => {
    setGerenciaSeleccionada('');
  };

  // Resetear todo
  const resetOrganigrama = () => {
    setDireccionSeleccionada('');
    setSubdireccionSeleccionada('');
    setGerenciaSeleccionada('');
  };

  // Obtener todas las áreas del organigrama para el área de visita
  const getAllAreas = useMemo(() => {
    const areas: string[] = [];

    organigrama.forEach(direccion => {
      // Agregar dirección
      areas.push(direccion.nombre);

      // Verificar si tiene subdirecciones
      if (direccion.subdirecciones && direccion.subdirecciones.length > 0) {
        // Agregar subdirecciones
        direccion.subdirecciones.forEach(subdireccion => {
          areas.push(`${direccion.nombre} - ${subdireccion.nombre}`);

          // Verificar si tiene gerencias
          if (subdireccion.gerencias && subdireccion.gerencias.length > 0) {
            // Agregar gerencias
            subdireccion.gerencias.forEach(gerencia => {
              areas.push(`${direccion.nombre} - ${subdireccion.nombre} - ${gerencia.nombre}`);
            });
          }
        });
      }
    });

    return areas;
  }, []);

  return {
    direcciones,
    subdirecciones,
    gerencias,
    direccionSeleccionada,
    subdireccionSeleccionada,
    gerenciaSeleccionada,
    setDireccionSeleccionada,
    setSubdireccionSeleccionada,
    setGerenciaSeleccionada,
    getDireccionCompleta,
    resetSubdirecciones,
    resetGerencias,
    resetOrganigrama,
    getAllAreas
  };
};