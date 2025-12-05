import { envs } from "./envs";
import jwt from "jsonwebtoken";

const JWT_SEED = envs.JWT_SEED;

export class JwtAdapter {
    static async generateToken(
        payload: string | object | Buffer,
        duration: string = "8h"
    ): Promise<string | null> {
        return new Promise((resolve) => {
            jwt.sign(
                payload,
                JWT_SEED as jwt.Secret, // Asegurar el tipo correcto
                { expiresIn: duration } as jwt.SignOptions, // Cast explícito
                (err, token) => {
                    if (err || !token) return resolve(null);
                    resolve(token);
                }
            );
        });
    }

    static validateToken<T>(token: string): Promise<T | null> {
        return new Promise((resolve) => {
            jwt.verify(
                token, 
                JWT_SEED as jwt.Secret, // Asegurar el tipo correcto
                (err, decoded) => {
                    if (err) return resolve(null);
                    resolve(decoded as T);
                }
            );
        });
    }
}