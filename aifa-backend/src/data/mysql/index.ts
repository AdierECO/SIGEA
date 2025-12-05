import { PrismaClient } from "@prisma/client";
import { bcryptjsAdapter, envs } from "../../config";

export const prisma = new PrismaClient();

export const connectionDB = async () => {
    try {
        await prisma.$connect();
        console.log("Base de datos online");

        const { USER_ADMIN, PASSWORD_ADMIN } = envs;

        const existAdmin = await prisma.usuario.findFirst({
            where: { email: USER_ADMIN }
        });

        if (!existAdmin) {
            await prisma.usuario.create({
                data: {
                    email: USER_ADMIN,
                    password: await bcryptjsAdapter.hash(PASSWORD_ADMIN),
                    nombre: "ADIER",
                    apellidos: "",
                    telefono: "7757505404",
                    rol: "SUPERADMIN"
                }
            });
            console.log("Usuario admin creado.");
        } else {
            console.log("Usuario admin ya existe.");
        }

    } catch (error) {
        console.error("Error conectando a la base de datos:", error);
        throw error;
    }
};