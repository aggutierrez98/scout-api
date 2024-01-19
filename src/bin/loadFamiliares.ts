import { PrismaClient, Prisma, EstadoCivil } from "@prisma/client";
import * as XLSX from "xlsx";
import ProgressBar from "progress";
import { excelDateToJSDate, parseDMYtoDate } from "../utils";
import { FamiliarXLSX } from "../types";
import { nanoid } from "nanoid";
const prisma = new PrismaClient();

const insertFamiliares = async () => {
    try {
        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO SCRIPT DE ACTUALIZACION FAMILIARES -------------\n",
        );

        const file = XLSX.readFile("dbdata/familiares.xlsx");
        const sheet = file.Sheets[file.SheetNames[0]];
        const data: FamiliarXLSX[] = XLSX.utils.sheet_to_json(sheet);

        const bar = new ProgressBar(
            "-> Leyendo familiares desde xlsx: [:bar] :percent - Tiempo restante: :etas",
            {
                total: data.length,
                width: 30,
            },
        );

        const familiares: Prisma.FamiliarCreateManyInput[] = [];
        for (const familiarXLSX of data) {

            const [apellido, nombre] = familiarXLSX.Nombre.split(", ");
            let fechaNacimiento = new Date();
            if (typeof familiarXLSX["Fecha Nacimiento"] === "number") {
                fechaNacimiento = excelDateToJSDate(familiarXLSX["Fecha Nacimiento"])
            }
            if (typeof familiarXLSX["Fecha Nacimiento"] === "string") {
                fechaNacimiento = parseDMYtoDate(familiarXLSX["Fecha Nacimiento"])
            }

            const sexo = familiarXLSX.Sexo === "Masculino" ? "M" : "F";

            familiares.push({
                uuid: nanoid(10),
                nombre,
                apellido,
                fechaNacimiento,
                sexo,
                dni: String(familiarXLSX.Documento),
                localidad: familiarXLSX.Localidad,
                direccion: familiarXLSX.Calle,
                telefono: String(familiarXLSX.Telefono),
                mail: familiarXLSX.Email,
                estadoCivil: familiarXLSX["Estado Civil"].toLocaleUpperCase() as EstadoCivil,
            });

            bar.tick(1);
        }

        console.log(`\n-> Cargando ${familiares.length} familiares a la bd...`);
        // await prisma.$queryRaw`ALTER TABLE familiar AUTO_INCREMENT = 1`;
        const result = await prisma.familiar.createMany({
            data: familiares,
            skipDuplicates: true,
        });

        console.log(`\n-> Se cararon exitosamente ${result.count} familiares a la bd!`);
        console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
        console.timeEnd("Tiempo de ejecucion");
    } catch (error) {
        console.log("Error en el script: ", (error as Error).message);
    } finally {
        await prisma.$disconnect();
    }
};

insertFamiliares();
