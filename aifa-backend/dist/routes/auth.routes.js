"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRouter = void 0;
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const role_middleware_1 = require("../middleware/role.middleware");
const auth_middleware_1 = require("../middleware/auth.middleware");
class AuthRouter {
    static get routes() {
        const router = (0, express_1.Router)();
        router.post('/', auth_controller_1.AuthController.login);
        router.patch('/desbloquear/:usuarioId', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR']), auth_controller_1.AuthController.desbloquearUsuario);
        return router;
    }
}
exports.AuthRouter = AuthRouter;
//# sourceMappingURL=auth.routes.js.map