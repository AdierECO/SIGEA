"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReporteRouter = void 0;
// routes/reporte.routes.ts
const express_1 = require("express");
const reporte_controller_1 = require("../controllers/reporte.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
class ReporteRouter {
    static get routes() {
        const router = (0, express_1.Router)();
        router.get('/global', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']), reporte_controller_1.ReporteController.getReporteGlobal);
        router.get('/estadisticas-rapidas', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR', 'OPERATIVO']), reporte_controller_1.ReporteController.getEstadisticasRapidas);
        router.get('/filtro/:filtroId', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']), reporte_controller_1.ReporteController.getReportePorFiltro);
        router.get('/usuario/:usuarioId', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']), reporte_controller_1.ReporteController.getReportePorUsuario);
        router.post('/exportar', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'SUPERVISOR']), reporte_controller_1.ReporteController.exportarReporte);
        return router;
    }
}
exports.ReporteRouter = ReporteRouter;
//# sourceMappingURL=reporte.routes.js.map