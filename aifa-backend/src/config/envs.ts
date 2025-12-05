import "dotenv/config";
import { get } from "env-var";

export const envs = {
    PORT: get("PORT").required().asPortNumber(), // Puerto en el que estara activo el servicio
    PUBLIC_PATH: get("PUBLIC_PATH").default("public").asString(), // Directorio donde se encuentra el contenido estatico que ser servido
    DATABASE_URL: get("DATABASE_URL").required().asString(), // Direccion sql de la base de datos
    JWT_SEED: get("JWT_SEED").required().asString(), // Clave secreta para la firma de los jwt\
    API_SERVICE: get("API_SERVICE").required().asUrlString(), // Direccion o dominio donde se encuentra escuchando el servicio
    FRONTEND_URL: get("FRONTEND_URL").required().asUrlString(), // Frontend
    USER_ADMIN: get("USER_ADMIN").required().asEmailString(),
    PASSWORD_ADMIN: get("PASSWORD_ADMIN").required().asString(),
}
