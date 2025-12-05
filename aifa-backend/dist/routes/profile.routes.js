"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRouter = void 0;
const express_1 = require("express");
const profile_controller_1 = require("../controllers/profile.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
class profileRouter {
    static get routes() {
        const router = (0, express_1.Router)();
        // Usar el método estático directamente
        router.get('/mi-perfil', auth_middleware_1.authMiddleware, profile_controller_1.ProfileController.getMiPerfil);
        router.put('/mi-perfil', auth_middleware_1.authMiddleware, profile_controller_1.ProfileController.updateMiPerfil);
        router.patch('/cambiar-password', auth_middleware_1.authMiddleware, profile_controller_1.ProfileController.cambiarPassword);
        router.get('/estadisticas', auth_middleware_1.authMiddleware, profile_controller_1.ProfileController.getMisEstadisticas);
        return router;
    }
}
exports.profileRouter = profileRouter;
//# sourceMappingURL=profile.routes.js.map