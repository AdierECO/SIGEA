"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const identificaciones_controller_1 = require("../controllers/identificaciones.controller");
const role_middleware_1 = require("../middleware/role.middleware");
class IdRouter {
    static get routes() {
        const router = (0, express_1.Router)();
        // Usar el método estático directamente
        router.get('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), identificaciones_controller_1.IdentificacionController.getIdentificacionesVigentes);
        router.get('/all', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), identificaciones_controller_1.IdentificacionController.getIdentificaciones);
        router.get('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), identificaciones_controller_1.IdentificacionController.getIdentificacionById);
        router.get('/numero/:numero', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), identificaciones_controller_1.IdentificacionController.getIdentificacionByNumero);
        router.post('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['OPERATIVO']), identificaciones_controller_1.IdentificacionController.createIdentificacion);
        router.put('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['OPERATIVO']), identificaciones_controller_1.IdentificacionController.updateIdentificacion);
        router.patch('/:id/vigencia', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['OPERATIVO']), identificaciones_controller_1.IdentificacionController.toggleVigenciaIdentificacion);
        return router;
    }
}
exports.IdRouter = IdRouter;
//# sourceMappingURL=identificaciones.routes.js.map