import { SecretsManager } from "../utils/classes/SecretsManager";
import { writeSpreadSheet } from "../utils/helpers/googleDriveApi";
import { Scout } from '@prisma/client';

export const saveUsers = async () => {
    let prismaClient;
    console.time("Tiempo de ejecucion");
    console.log("------------ INICIANDO SCRIPT PARA GUARDAR USUARIOS EN SPREASHEETS -------------\n");

    try {

        await SecretsManager.getInstance().initialize();
        prismaClient = (await import("../utils/lib/prisma-client")).prismaClient;
        if (!prismaClient) {
            throw new Error("Prisma Client no inicializado");
        }

        const scouts = await prismaClient.scout.findMany({
            where: {
                user: {
                    isNot: null
                }
            },
            include: {
                user: {
                    select: {
                        uuid: true,
                    }
                }
            }
        })

        const result = await writeSpreadSheet("usuarios", scouts.map((scout: Scout) => ({
            DNI: scout.dni,
            //@ts-ignore
            UserId: scout.user?.uuid!
        })))

        console.log(`\n-> Se cararon exitosamente ${result.length} usuarios a spreadsheet!`);
        console.log(
            "------------ SCRIPT FINALIZADO -------------\n",
        );
        console.timeEnd("Tiempo de ejecucion");
    } catch (error) {
        console.log("Error en el script: ", (error as Error).message);
    } finally {
        if (prismaClient) {
            await prismaClient.$disconnect();
        }
    }
};

// saveUsers();
