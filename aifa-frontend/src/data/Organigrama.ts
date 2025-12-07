export type TipoRequerimientoAcompanante = "opcional" | "requerido";

export interface ElementoOrganigrama {
  nombre: string;
  codigo: string;
  requiereAcompanante: TipoRequerimientoAcompanante;
  subdirecciones?: Subdireccion[];
}

export interface Subdireccion {
  nombre: string;
  codigo: string;
  requiereAcompanante: TipoRequerimientoAcompanante;
  gerencias?: Gerencia[];
}

export interface Gerencia {
  nombre: string;
  codigo: string;
  requiereAcompanante: TipoRequerimientoAcompanante;
}

export const organigrama: ElementoOrganigrama[] = [
  {
    nombre: "Dirección General",
    codigo: "",
    requiereAcompanante: "requerido",
    subdirecciones: [
      {
        nombre: "Subdirección Coordinación y Seguimientos de acuerdos",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Relaciones Públicas y Salón Oficial", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Comunicación Social", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Gestión de la Seguridad Operacional (SMS)", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Gerencia de Transparencia y Rendición de Cuentas",
        codigo: "N32",
        requiereAcompanante: "requerido",
        gerencias: []
      },
      {
        nombre: "Gerencia de Procesos y Estadísticas",
        codigo: "N32",
        requiereAcompanante: "requerido",
        gerencias: []
      },
    ]
  },
  {
    nombre: "Dirección del Órgano Interno de Control",
    codigo: "K11",
    requiereAcompanante: "opcional",
    subdirecciones: [
      {
        nombre: "Titular del Área de Responsabilidades",
        codigo: "M33",
        requiereAcompanante: "opcional",
        gerencias: []
      },
      {
        nombre: "Titular del Área de Auditoría",
        codigo: "M33",
        requiereAcompanante: "opcional",
        gerencias: [
          { nombre: "Gerencia de Auditoría 'A'", codigo: "N32", requiereAcompanante: "opcional" }
        ]
      },
      {
        nombre: "Titular del Área de Denuncias e Investigaciones",
        codigo: "M33",
        requiereAcompanante: "opcional",
        gerencias: []
      },
    ]
  },
  {
    nombre: "Agencia Federal de Aviación Civil (AFAC)",
    codigo: "K11",
    requiereAcompanante: "opcional",
    subdirecciones: [
    ]
  },
  {
    nombre: "Dirección de Operación",
    codigo: "K11",
    requiereAcompanante: "requerido",
    subdirecciones: [
      {
        nombre: "Subdirección de Seguridad Operacional",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Operaciones Edificio Terminal", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Operaciones Parte Aeronáutica", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Seguridad Operacional", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Servicios Médicos", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Subdirección de Seguridad de la Aviación",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Seguridad", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Identificación Aeroportuaria", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Programas de Seguridad", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Protección Civil", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Subdirección de Ingeniería",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Proyectos y Concursos", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Ingeniería Civil", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Ingeniería Electromecánica", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Opn. y Manto de Instls. Hidráulicas", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Subdirección de Servicios Conexos",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Carga", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Combustibles", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Aviación General", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Subdirección de Gestión Energética",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Transformación y Distribución", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Generación", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      }
    ]
  },
  {
    nombre: "Dirección de Planeación Estratégica",
    codigo: "K11",
    requiereAcompanante: "requerido",
    subdirecciones: [
      {
        nombre: "Subdirección de Coordinación Estratégica",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Planeación", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Gestión de Riesgo y Calidad", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Planeación Gubernamental", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Subdirección de Proyectos",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Análisis Costo–Beneficio", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Administración de Proyectos", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Desarrollo Sustentable", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Subdirección de Seguimiento y Control",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Información y Seguimiento", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Evaluación del Desempeño", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      }
    ]
  },
  {
    nombre: "Dirección Comercial y de Servicios",
    codigo: "K11",
    requiereAcompanante: "requerido",
    subdirecciones: [
      {
        nombre: "Subdirección de Servicios Comerciales",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Servicios Comerciales", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Espacios Publicitarios", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Mercadotecnia", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Subdirección de Servicios Aeroportuarios y Complementarios",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Servicios Aeroportuarios", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Servicios Complementarios", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Subdirección de Movilidad y Calidad",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Movilidad Terrestre", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Calidad", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      }
    ]
  },
  {
    nombre: "Dirección de Administración",
    codigo: "K11",
    requiereAcompanante: "requerido",
    subdirecciones: [
      {
        nombre: "Subdirección de Recursos Humanos",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Empleo y Capacitación", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Administración de Personal", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Jefe de Oficina Administrativa", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Subdirección de Recursos Materiales",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Recursos Materiales", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Servicios Generales", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Investigación de Mercado", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Subdirección de Recursos Financieros",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Presupuesto", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Tesorería", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Contabilidad", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Cobranza", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Subdirección de TIC",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Desarrollo e Informática", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Soporte Técnico y Comunicaciones", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Seguridad Informática", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      }
    ]
  },
  {
    nombre: "Dirección Jurídica",
    codigo: "K11",
    requiereAcompanante: "requerido",
    subdirecciones: [
      {
        nombre: "Subdirección Consultiva",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia Consultiva", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Contratos", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Subdirección Contenciosa",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Juicios", codigo: "N32", requiereAcompanante: "requerido" },
          { nombre: "Gerencia de Coordinación Jurídica Externa", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      },
      {
        nombre: "Subdirección de Asuntos Corporativos",
        codigo: "M33",
        requiereAcompanante: "requerido",
        gerencias: [
          { nombre: "Gerencia de Normatividad", codigo: "N32", requiereAcompanante: "requerido" }
        ]
      }
    ]
  },
  {
    nombre: "Aduanas",
    codigo: "K11",
    requiereAcompanante: "opcional",
    subdirecciones: [
    ]
  },
  {
    nombre: "Migración",
    codigo: "K11",
    requiereAcompanante: "opcional",
    subdirecciones: [
    ]
  },
  {
    nombre: "Sala de consejo",
    codigo: "K11",
    requiereAcompanante: "requerido",
    subdirecciones: [
    ]
  },
  {
    nombre: "Caja de Cobro",
    codigo: "K11",
    requiereAcompanante: "opcional",
    subdirecciones: [
    ]
  },
  {
    nombre: "Proveedor",
    codigo: "K11",
    requiereAcompanante: "opcional",
    subdirecciones: [
    ]
  }
  
];