"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const config_1 = require("../config");
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }
        const payload = await config_1.JwtAdapter.validateToken(token);
        if (!payload) {
            return res.status(401).json({ error: 'Token inválido' });
        }
        req.user = payload;
        next();
    }
    catch (error) {
        console.error(error);
        res.status(401).json({ error: 'Token inválido' });
    }
};
exports.authMiddleware = authMiddleware;
//# sourceMappingURL=auth.middleware.js.map