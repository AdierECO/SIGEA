"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usuarioRouter = void 0;
const express_1 = require("express");
const usuario_controller_1 = require("../controllers/usuario.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
class usuarioRouter {
    static get routes() {
        const router = (0, express_1.Router)();
        router.get('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), usuario_controller_1.UsuarioController.getUsuarios);
        router.get('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), usuario_controller_1.UsuarioController.getUsuarioById);
        router.post('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR']), usuario_controller_1.UsuarioController.createUsuario);
        router.put('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'OPERATIVO']), usuario_controller_1.UsuarioController.updateUsuario);
        router.delete('/delete/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR']), usuario_controller_1.UsuarioController.deleteUsuario);
        return router;
    }
}
exports.usuarioRouter = usuarioRouter;
;
//# sourceMappingURL=usuario.routes.js.map