"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAdapter = void 0;
const envs_1 = require("./envs");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SEED = envs_1.envs.JWT_SEED;
class JwtAdapter {
    static async generateToken(payload, duration = "8h") {
        return new Promise((resolve) => {
            jsonwebtoken_1.default.sign(payload, JWT_SEED, // Asegurar el tipo correcto
            { expiresIn: duration }, // Cast explícito
            (err, token) => {
                if (err || !token)
                    return resolve(null);
                resolve(token);
            });
        });
    }
    static validateToken(token) {
        return new Promise((resolve) => {
            jsonwebtoken_1.default.verify(token, JWT_SEED, // Asegurar el tipo correcto
            (err, decoded) => {
                if (err)
                    return resolve(null);
                resolve(decoded);
            });
        });
    }
}
exports.JwtAdapter = JwtAdapter;
//# sourceMappingURL=jwt.adapter.js.map