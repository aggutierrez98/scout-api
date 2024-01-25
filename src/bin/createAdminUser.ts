import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { encrypt } from "../utils/lib/bcrypt.util";
import { FuncionType, SexoType } from "../types";

interface AdminData {
    username: string
    password: string
    dni: string
    nombre: string
    apellido: string
    sexo: SexoType
    fechaNacimiento: string
    localidad: string
    direccion: string
    telefono: string
    mail: string
    funcion: FuncionType
}



const deleteDBData = async () => {
    const prisma = new PrismaClient();
    await prisma.$connect()

    try {
        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO CREACION DE USUARIO ADMIN DENTRO DE DB -------------\n",
        );

        const { username, password, ...scoutData } = JSON.parse(process.env.ADMIN_DATA!) as AdminData
        if (!username || !password) throw new Error("Es necesario aclarar usuario y contraseña")

        const uuidScout = nanoid(10);
        const uuidUser = nanoid(10);
        const passHash = await encrypt(password)

        await prisma.scout.create({
            data: {
                uuid: uuidScout,
                ...scoutData
            },
        });
        await prisma.user.create({
            data: {
                uuid: uuidUser,
                username,
                password: passHash,
                scoutId: uuidScout,
                role: "ADMIN"
            },
        });

        console.log(
            "------------ SCRIPT FINALIZADO -------------\n",
        );
        console.timeEnd("Tiempo de ejecucion");
    } catch (error) {
        console.log("Error en el script: ", (error as Error).message);
    } finally {
        await prisma.$disconnect();
    }
};

deleteDBData();
