"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditoriaRouter = void 0;
const express_1 = require("express");
const auditoria_controller_1 = require("../controllers/auditoria.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
class AuditoriaRouter {
    static get routes() {
        const router = (0, express_1.Router)();
        router.get('/filtro', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']), auditoria_controller_1.AuditoriaController.getLogsFiltro);
        router.get('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']), auditoria_controller_1.AuditoriaController.getDetalleAuditoria);
        router.get('/filtro/estadisticas', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']), auditoria_controller_1.AuditoriaController.getEstadisticasFiltro);
        return router;
    }
}
exports.AuditoriaRouter = AuditoriaRouter;
//# sourceMappingURL=auditoria.routes.js.map