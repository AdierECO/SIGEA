import { Request, Response } from 'express';
export declare class ProfileController {
    /**
     * Obtener el perfil del usuario autenticado
     */
    static getMiPerfil: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Actualizar el perfil del usuario autenticado
     */
    static updateMiPerfil: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Cambiar contraseña del usuario autenticado
     */
    static cambiarPassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Obtener estadísticas del usuario autenticado
     */
    static getMisEstadisticas: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=profile.controller.d.ts.map