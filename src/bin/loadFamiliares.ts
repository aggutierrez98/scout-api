import { Prisma } from "@prisma/client";
import ProgressBar from "progress";
import { SPLIT_STRING, excelDateToJSDate, parseDMYtoDate } from "../utils";
import { nanoid } from "nanoid";
import { getSpreadSheetData } from "../utils/helpers/googleDriveApi";
import { EstadoCivilType } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";

const insertFamiliares = async () => {

    try {
        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO SCRIPT DE ACTUALIZACION FAMILIARES -------------\n",
        );

        const data = await getSpreadSheetData("familiares")

        const bar = new ProgressBar(
            "-> Leyendo familiares desde xlsx: [:bar] :percent - Tiempo restante: :etas",
            {
                total: data.length,
                width: 30,
            },
        );

        const familiares: Prisma.FamiliarCreateManyInput[] = [];

        for (const familiarData of data) {

            const [apellido, nombre] = familiarData.Nombre!.split(SPLIT_STRING);
            let fechaNacimiento = new Date();
            if (typeof familiarData["Fecha Nacimiento"] === "number") {
                fechaNacimiento = excelDateToJSDate(familiarData["Fecha Nacimiento"])
            }
            if (typeof familiarData["Fecha Nacimiento"] === "string") {
                fechaNacimiento = parseDMYtoDate(familiarData["Fecha Nacimiento"])
            }

            const sexo = familiarData.Sexo === "Masculino" ? "M" : "F";

            familiares.push({
                uuid: nanoid(10),
                nombre,
                apellido,
                fechaNacimiento,
                sexo,
                dni: String(familiarData.Documento),
                localidad: familiarData.Localidad!,
                direccion: familiarData.Calle!,
                telefono: String(familiarData.Telefono),
                mail: familiarData.Email,
                estadoCivil: familiarData["Estado Civil"]!.toLocaleUpperCase() as EstadoCivilType,
                nacionalidad: familiarData.Nacionalidad ?? "",
                provincia: familiarData.Provincia ?? "",
            });

            bar.tick(1);
        }

        console.log(`\n-> Cargando ${familiares.length} familiares a la bd...`);
        // await prismaClient.$queryRaw`ALTER TABLE Familiar AUTO_INCREMENT = 1`;
        await prismaClient.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'Familiar'`;
        const result = await prismaClient.familiar.createMany({
            data: familiares,
            // skipDuplicates: true,
        });

        console.log(`\n-> Se cararon exitosamente ${result.count} familiares a la bd!`);
        console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
        console.timeEnd("Tiempo de ejecucion");
    } catch (error) {
        console.error("Error en el script: ", (error as Error).message);
    } finally {
        await prismaClient.$disconnect();
    }
};

insertFamiliares();
