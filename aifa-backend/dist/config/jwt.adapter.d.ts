export declare class JwtAdapter {
    static generateToken(payload: string | object | Buffer, duration?: string): Promise<string | null>;
    static validateToken<T>(token: string): Promise<T | null>;
}
//# sourceMappingURL=jwt.adapter.d.ts.map