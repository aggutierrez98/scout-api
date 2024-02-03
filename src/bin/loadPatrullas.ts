import { PrismaClient, Prisma } from "@prisma/client";
import ProgressBar from "progress";
import { nanoid } from "nanoid";
import { getSpreadSheetData } from "../utils/helpers/googleDriveApi";

const loadPatrullas = async () => {
    const prisma = new PrismaClient();
    await prisma.$connect()

    try {
        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO SCRIPT DE ACTUALIZACION PATRULLAS -------------\n",
        );

        const data = await getSpreadSheetData("patrullas")

        const bar = new ProgressBar(
            "-> Leyendo patrullas desde xlsx: [:bar] :percent - Tiempo restante: :etas",
            {
                total: data.length,
                width: 30,
            },
        );

        const patrullas: Prisma.PatrullaCreateManyInput[] = [];

        for (const patrullaData of data) {
            patrullas.push({
                uuid: nanoid(10),
                nombre: patrullaData.Nombre!,
                lema: patrullaData.Lema
            });

            bar.tick(1);
        }

        console.log(`\n-> Cargando ${patrullas.length} patrullas a la bd...`);
        await prisma.$queryRaw`ALTER TABLE Patrulla AUTO_INCREMENT = 1`;
        const result = await prisma.patrulla.createMany({
            data: patrullas,
            skipDuplicates: true,
        });

        console.log(`\n-> Se cargaron exitosamente ${result.count} patrullas a la bd!`);
        console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
        console.timeEnd("Tiempo de ejecucion");
    } catch (error) {
        console.log("Error en el script: ", (error as Error).message);
    } finally {
        await prisma.$disconnect();
    }
};

loadPatrullas();
