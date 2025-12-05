import { $Enums } from "@prisma/client";
export interface ExportacionResultado {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
}
export interface DatosExportacion {
    accesos: any[];
    inicio: Date;
    fin: Date;
    usuario: any;
    tipoReporte: any;
    registradoPor?: string;
    filtro?: {
        id: number;
        nombre: string;
        descripcion?: string | null;
        ubicacion?: string | null;
        estaActivo: boolean;
    } | null;
    usuarioInfo: {
        id: number;
        nombre: string;
        apellidos: string;
        email: string;
        rol: $Enums.Rol;
        estaActivo: boolean;
    } | null;
}
export interface OpcionesExportacion {
    incluirEstadisticas?: boolean;
    incluirGraficos?: boolean;
    formato?: 'detallado' | 'resumido';
}
//# sourceMappingURL=exportacion.types.d.ts.map