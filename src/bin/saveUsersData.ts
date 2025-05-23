import { writeSpreadSheet } from "../utils/helpers/googleDriveApi";
import { prismaClient } from "../utils/lib/prisma-client";

const createAdmin = async () => {

    try {
        console.time("Tiempo de ejecucion");
        console.log("------------ INICIANDO SCRIPT PARA GUARDAR USUARIOS EN SPREASHEETS -------------\n");

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

        const result = await writeSpreadSheet("usuarios", scouts.map(scout => ({
            DNI: scout.dni,
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
        await prismaClient.$disconnect();
    }
};

createAdmin();
