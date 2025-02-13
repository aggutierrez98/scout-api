import { PrismaClient, Prisma } from "@prisma/client";
import ProgressBar from "progress";
import { nanoid } from "nanoid";
import { getSpreadSheetData } from "../utils/helpers/googleDriveApi";

const loadEquipos = async () => {
    const prisma = new PrismaClient();
    await prisma.$connect()

    try {
        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO SCRIPT DE ACTUALIZACION EQUIPOS -------------\n",
        );

        const data = await getSpreadSheetData("equipos")

        const bar = new ProgressBar(
            "-> Leyendo equipos desde xlsx: [:bar] :percent - Tiempo restante: :etas",
            {
                total: data.length,
                width: 30,
            },
        );

        const equipos: Prisma.EquipoCreateManyInput[] = [];

        for (const equipoData of data) {
            equipos.push({
                uuid: nanoid(10),
                nombre: equipoData.Nombre!,
                lema: equipoData.Lema
            });

            bar.tick(1);
        }

        console.log(`\n-> Cargando ${equipos.length} equipos a la bd...`);
        // await prisma.$queryRaw`ALTER TABLE Equipo AUTO_INCREMENT = 1`;
        await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'Equipo'`;

        const result = await prisma.equipo.createMany({
            data: equipos,
            // skipDuplicates: true,
        });

        console.log(`\n-> Se cargaron exitosamente ${result.count} equipos a la bd!`);
        console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
        console.timeEnd("Tiempo de ejecucion");
    } catch (error) {
        console.log("Error en el script: ", (error as Error).message);
    } finally {
        await prisma.$disconnect();
    }
};

loadEquipos();
