export interface Evidencia {
    id: number;
    nombreArchivo: string;
    ruta: string;
    tipo: string;
    accesoId: number;
    fechaCreacion: Date;
}
export interface CreateEvidenciaDto {
    nombreArchivo: string;
    ruta: string;
    tipo: string;
    accesoId: number;
}
//# sourceMappingURL=evidencia.types.d.ts.map