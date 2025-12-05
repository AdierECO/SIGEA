"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TIASRouter = void 0;
const express_1 = require("express");
const tias_Controller_1 = require("../controllers/tias.Controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
class TIASRouter {
    static get routes() {
        const router = (0, express_1.Router)();
        router.get('/disponibles', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR', 'OPERATIVO']), tias_Controller_1.TIASController.getTIASDisponibles);
        router.get('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR', 'OPERATIVO']), tias_Controller_1.TIASController.getTIAS);
        router.get('/estadisticas', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR', 'OPERATIVO']), tias_Controller_1.TIASController.getEstadisticasTIAS);
        router.get('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR', 'OPERATIVO']), tias_Controller_1.TIASController.getTIASById);
        router.post('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR', 'OPERATIVO']), tias_Controller_1.TIASController.createTIAS);
        router.post('/rango', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR']), tias_Controller_1.TIASController.createTIASRango);
        router.put('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR']), tias_Controller_1.TIASController.updateTIAS);
        router.delete('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR']), tias_Controller_1.TIASController.deleteTIAS);
        return router;
    }
}
exports.TIASRouter = TIASRouter;
//# sourceMappingURL=tias.routes.js.map