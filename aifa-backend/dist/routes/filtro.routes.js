"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiltroRouter = void 0;
// routes/filtro.routes.ts
const express_1 = require("express");
const filtro_controller_1 = require("../controllers/filtro.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
class FiltroRouter {
    static get routes() {
        const router = (0, express_1.Router)();
        router.get('/activos', filtro_controller_1.FiltroController.getFiltrosActivos);
        router.get('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']), filtro_controller_1.FiltroController.getFiltros);
        router.get('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']), filtro_controller_1.FiltroController.getFiltroById);
        router.post('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR']), filtro_controller_1.FiltroController.createFiltro);
        router.put('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR']), filtro_controller_1.FiltroController.updateFiltro);
        router.delete('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR']), filtro_controller_1.FiltroController.deleteFiltro);
        return router;
    }
}
exports.FiltroRouter = FiltroRouter;
//# sourceMappingURL=filtro.routes.js.map