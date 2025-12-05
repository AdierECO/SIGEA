"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupRouter = void 0;
// routes/backup.routes.ts
const express_1 = require("express");
const backup_controller_1 = require("../controllers/backup.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 * 1024
    }
});
class BackupRouter {
    static get routes() {
        const router = (0, express_1.Router)();
        router.get('/estadisticas', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'OPERATIVO']), backup_controller_1.BackupController.getEstadisticas);
        router.get('/estadisticas-backups', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR']), backup_controller_1.BackupController.getEstadisticasBackups);
        router.post('/exportar', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'OPERATIVO']), backup_controller_1.BackupController.exportarDB);
        router.post('/importar', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR']), upload.single('archivo'), backup_controller_1.BackupController.importarDB);
        router.get('/historial', auth_middleware_1.authMiddleware, (0, role_middleware_1.roleMiddleware)(['SUPERADMIN', 'ADMINISTRADOR', 'OPERATIVO']), backup_controller_1.BackupController.getHistorial);
        return router;
    }
}
exports.BackupRouter = BackupRouter;
//# sourceMappingURL=backup.routes.js.map