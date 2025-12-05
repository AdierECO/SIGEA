"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppRoutes = void 0;
const express_1 = require("express");
const acceso_routes_1 = require("./routes/acceso.routes");
const auth_routes_1 = require("./routes/auth.routes");
const turno_routes_1 = require("./routes/turno.routes");
const usuario_routes_1 = require("./routes/usuario.routes");
const identificaciones_routes_1 = require("./routes/identificaciones.routes");
const profile_routes_1 = require("./routes/profile.routes");
const backup_routes_1 = require("./routes/backup.routes");
const filtro_routes_1 = require("./routes/filtro.routes");
const reporte_routes_1 = require("./routes/reporte.routes");
const auditoria_routes_1 = require("./routes/auditoria.routes");
const tias_routes_1 = require("./routes/tias.routes");
class AppRoutes {
    static get routes() {
        const router = (0, express_1.Router)();
        router.use("/api/accesos", acceso_routes_1.accesoRouter.routes);
        router.use("/api/login", auth_routes_1.AuthRouter.routes);
        router.use("/api/turnos", turno_routes_1.turnoRouter.routes);
        router.use("/api/usuarios", usuario_routes_1.usuarioRouter.routes);
        router.use("/api/identificaciones", identificaciones_routes_1.IdRouter.routes);
        router.use("/api/perfil", profile_routes_1.profileRouter.routes);
        router.use("/api/backup", backup_routes_1.BackupRouter.routes);
        router.use("/api/filtros", filtro_routes_1.FiltroRouter.routes);
        router.use("/api/reportes", reporte_routes_1.ReporteRouter.routes);
        router.use("/api/auditoria", auditoria_routes_1.AuditoriaRouter.routes);
        router.use("/api/tias", tias_routes_1.TIASRouter.routes);
        return router;
    }
}
exports.AppRoutes = AppRoutes;
//# sourceMappingURL=routes.js.map