import { Router } from "express";
import { accesoRouter } from "./routes/acceso.routes";
import { AuthRouter } from "./routes/auth.routes";
import { turnoRouter } from "./routes/turno.routes";
import { usuarioRouter } from "./routes/usuario.routes";
import { IdRouter } from "./routes/identificaciones.routes";
import { profileRouter } from "./routes/profile.routes";
import { BackupRouter } from "./routes/backup.routes";
import { FiltroRouter } from "./routes/filtro.routes";
import { ReporteRouter } from "./routes/reporte.routes";
import { AuditoriaRouter } from "./routes/auditoria.routes";
import { TIASRouter } from "./routes/tias.routes";

export class AppRoutes {
    static get routes(): Router {
        const router = Router();

        router.use("/api/accesos", accesoRouter.routes);
        router.use("/api/login", AuthRouter.routes);
        router.use("/api/turnos", turnoRouter.routes);
        router.use("/api/usuarios", usuarioRouter.routes);
        router.use("/api/identificaciones", IdRouter.routes);
        router.use("/api/perfil", profileRouter.routes);
        router.use("/api/backup", BackupRouter.routes);
        router.use("/api/filtros", FiltroRouter.routes);
        router.use("/api/reportes", ReporteRouter.routes);
        router.use("/api/auditoria", AuditoriaRouter.routes);
        router.use("/api/tias", TIASRouter.routes); 
        return router;
    }
}