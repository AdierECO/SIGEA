"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.turnoRouter = void 0;
const express_1 = require("express");
const turno_controller_1 = require("../controllers/turno.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
class turnoRouter {
    static get routes() {
        const router = (0, express_1.Router)();
        router.get('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), turno_controller_1.TurnoController.getTurnos);
        router.get('/activos', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), turno_controller_1.TurnoController.getTurnosActivos);
        router.get('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), turno_controller_1.TurnoController.getTurnoById);
        router.post('/', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR']), turno_controller_1.TurnoController.createTurno);
        router.put('/:id', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR']), turno_controller_1.TurnoController.updateTurno);
        router.patch('/:id/asignar', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR']), turno_controller_1.TurnoController.asignarTurno);
        router.patch('/:id/desasignarall', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR']), turno_controller_1.TurnoController.desasignarTurno);
        router.delete('/:id/desasignar', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR']), turno_controller_1.TurnoController.desasignarUsuarioTurno);
        router.delete('/delete/:id/', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['ADMINISTRADOR']), turno_controller_1.TurnoController.deleteTurno);
        return router;
    }
}
exports.turnoRouter = turnoRouter;
//# sourceMappingURL=turno.routes.js.map