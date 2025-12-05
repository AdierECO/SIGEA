"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accesoRouter = void 0;
const express_1 = require("express");
const acceso_controller_1 = require("../controllers/acceso.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
class accesoRouter {
    static get routes() {
        const router = (0, express_1.Router)();
        router.get('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), acceso_controller_1.AccesoController.getAccesos);
        router.get('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), acceso_controller_1.AccesoController.getAccesoById);
        router.post('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['OPERATIVO']), acceso_controller_1.AccesoController.createAcceso);
        router.put('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['OPERATIVO']), acceso_controller_1.AccesoController.updateAcceso);
        router.patch('/:id/salida', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['OPERATIVO']), acceso_controller_1.AccesoController.registrarSalida);
        return router;
    }
}
exports.accesoRouter = accesoRouter;
//# sourceMappingURL=acceso.routes.js.map