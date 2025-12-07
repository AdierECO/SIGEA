import type {TipoRequerimientoAcompanante } from '../data/Organigrama';
import { organigrama } from '../data/Organigrama';

// Función para obtener el requerimiento del escolta
export const obtenerRequerimientoAcompanante = (
  direccion: string,
  subdireccion: string = "",
  gerencia: string = ""
): TipoRequerimientoAcompanante => {
  const direccionEncontrada = organigrama.find(d => d.nombre === direccion);
  if (!direccionEncontrada) return "opcional"; // Valor por defecto si no encuentra

  // Si no hay subdirección seleccionada, retorna el valor de la dirección
  if (!subdireccion || subdireccion === "") {
    return direccionEncontrada.requiereAcompanante;
  }

  // Buscar la subdirección
  const subdireccionEncontrada = direccionEncontrada.subdirecciones?.find(s => s.nombre === subdireccion);
  if (!subdireccionEncontrada) {
    // Si no encuentra la subdirección, retorna el valor de la dirección
    return direccionEncontrada.requiereAcompanante;
  }

  // Si no hay gerencia seleccionada, retorna el valor de la subdirección
  if (!gerencia || gerencia === "") {
    return subdireccionEncontrada.requiereAcompanante;
  }

  // Buscar la gerencia
  const gerenciaEncontrada = subdireccionEncontrada.gerencias?.find(g => g.nombre === gerencia);
  if (!gerenciaEncontrada) {
    // Si no encuentra la gerencia, retorna el valor de la subdirección
    return subdireccionEncontrada.requiereAcompanante;
  }

  // Retorna el valor de la gerencia
  return gerenciaEncontrada.requiereAcompanante;
};

// Función para verificar si el área seleccionada requiere escolta
export const requiereAcompanante = (
  direccion: string,
  subdireccion: string = "",
  gerencia: string = ""
): boolean => {
  const requerimiento = obtenerRequerimientoAcompanante(direccion, subdireccion, gerencia);
  return requerimiento === "requerido";
};
