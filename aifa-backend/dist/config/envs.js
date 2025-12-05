"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envs = void 0;
require("dotenv/config");
const env_var_1 = require("env-var");
exports.envs = {
    PORT: (0, env_var_1.get)("PORT").required().asPortNumber(), // Puerto en el que estara activo el servicio
    PUBLIC_PATH: (0, env_var_1.get)("PUBLIC_PATH").default("public").asString(), // Directorio donde se encuentra el contenido estatico que ser servido
    DATABASE_URL: (0, env_var_1.get)("DATABASE_URL").required().asString(), // Direccion sql de la base de datos
    JWT_SEED: (0, env_var_1.get)("JWT_SEED").required().asString(), // Clave secreta para la firma de los jwt\
    API_SERVICE: (0, env_var_1.get)("API_SERVICE").required().asUrlString(), // Direccion o dominio donde se encuentra escuchando el servicio
    FRONTEND_URL: (0, env_var_1.get)("FRONTEND_URL").required().asUrlString(), // Frontend
    USER_ADMIN: (0, env_var_1.get)("USER_ADMIN").required().asEmailString(),
    PASSWORD_ADMIN: (0, env_var_1.get)("PASSWORD_ADMIN").required().asString(),
};
//# sourceMappingURL=envs.js.map