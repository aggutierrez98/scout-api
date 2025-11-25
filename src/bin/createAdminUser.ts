import prp from "prompt-sync"
const prompt = prp();
import { nanoid } from "nanoid";
import { encrypt } from "../utils/lib/bcrypt.util";
import { RegisterSchema } from "../validators/auth";
import { ROLES } from "../types";
import { SecretsManager } from "../utils/classes/SecretsManager";

const createAdmin = async () => {

    let prismaClient;

    try {
        await SecretsManager.getInstance().initialize();
        prismaClient = (await import("../utils/lib/prisma-client")).prismaClient;
        if (!prismaClient) {
            throw new Error("Prisma Client no inicializado");
        }

        console.log(
            "------------ INICIANDO CREACION DE USUARIO ADMIN DENTRO DE DB -------------\n",
        );

        console.log("-----Ingresar credenciales para el usuario ADMIN-----\n")

        const username = prompt("Ingresar nombre de usuario: ")
        const password = prompt.hide("Ingresar contraseña: ");
        const role = ROLES.ADMINISTRADOR

        const parseReturn = await RegisterSchema.safeParseAsync({ body: { username, password, role } })

        if (!parseReturn.success) {
            console.log("\nError: Las credenciales ingresadas no son validas")
            console.log(parseReturn.error.errors.map(error => `- ${error.path[1]}: ${error.message}`).join("\n"))
            return
        }

        const uuid = nanoid(10);

        const passHash = await encrypt(password)

        const res = await prismaClient.user.create({
            data: { password: passHash, uuid, username, role },
        })

        if (res) console.info(`\nUsuario "${username}" creado con exito!\n`)
        else console.log(`\nError al crear usuario!\n`)

    } catch (error) {
        console.error("\nError en el script: ", (error as Error).message);
    } finally {
        console.log(
            "\n------------ SCRIPT FINALIZADO -------------\n",
        );
        if (prismaClient) {
            await prismaClient.$disconnect();
        }
    }
};

createAdmin();
