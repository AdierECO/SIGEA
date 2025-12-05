import { Usuario } from "@prisma/client";
export interface LoginDto {
    email: string;
    password: string;
}
export interface AuthResponse {
    token: string;
    usuario: Usuario;
}
export interface JwtPayload {
    id: number;
    email: string;
    rol: string;
}
//# sourceMappingURL=auth.types.d.ts.map