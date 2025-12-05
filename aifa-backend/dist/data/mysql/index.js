"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionDB = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const config_1 = require("../../config");
exports.prisma = new client_1.PrismaClient();
const connectionDB = async () => {
    try {
        await exports.prisma.$connect();
        console.log("Base de datos online");
        const { USER_ADMIN, PASSWORD_ADMIN } = config_1.envs;
        const existAdmin = await exports.prisma.usuario.findFirst({
            where: { email: USER_ADMIN }
        });
        if (!existAdmin) {
            await exports.prisma.usuario.create({
                data: {
                    email: USER_ADMIN,
                    password: await config_1.bcryptjsAdapter.hash(PASSWORD_ADMIN),
                    nombre: "ADIER",
                    apellidos: "",
                    telefono: "7757505404",
                    rol: "SUPERADMIN"
                }
            });
            console.log("Usuario admin creado.");
        }
        else {
            console.log("Usuario admin ya existe.");
        }
    }
    catch (error) {
        console.error("Error conectando a la base de datos:", error);
        throw error;
    }
};
exports.connectionDB = connectionDB;
//# sourceMappingURL=index.js.map