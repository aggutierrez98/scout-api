import { PrismaClient, Prisma, Funcion, Progresion } from "@prisma/client";
import ProgressBar from "progress";
import { VALID_RELATIONSHIPS, excelDateToJSDate, parseDMYtoDate } from "../utils";
import { EstadosType, RelacionFamiliarType, ReligionType, ScoutXLSX, UsuarioXLSX } from "../types";
import { nanoid } from "nanoid";
import { getSpreadSheetData } from "../utils/helpers/googleDriveApi";

const loadPagos = async () => {
    const prisma = new PrismaClient();
    await prisma.$connect()

    try {

        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO SCRIPT DE ACTUALIZACION SCOUTS -------------\n",
        );

        const data = await getSpreadSheetData("scouts")
        const dataUsers = await getSpreadSheetData("usuarios")

        const bar = new ProgressBar(
            "-> Leyendo scouts desde xlsx: [:bar] :percent - Tiempo restante: :etas",
            {
                total: data.length,
                width: 30,
            },
        );

        const scouts: Prisma.ScoutCreateManyInput[] = [];
        for (const scoutData of data) {

            const [apellido, nombre] = scoutData.Nombre!.split(", ");

            let fechaNacimiento = new Date();
            if (typeof scoutData["Fecha Nacimiento"] === "number") {
                fechaNacimiento = excelDateToJSDate(scoutData["Fecha Nacimiento"])
            }
            if (typeof scoutData["Fecha Nacimiento"] === "string") {
                fechaNacimiento = parseDMYtoDate(scoutData["Fecha Nacimiento"])
            }

            const sexo = scoutData.Sexo === "Masculino" ? "M" : "F";
            const funcion: Funcion =
                scoutData.Funcion === "Scout"
                    ? "JOVEN"
                    : scoutData.Funcion === "Jefe"
                        ? "JEFE"
                        : scoutData.Funcion === "Sub-Jefe"
                            ? "SUBJEFE"
                            : scoutData.Funcion === "Ayudante"
                                ? "AYUDANTE"
                                : "COLABORADOR";

            const progresionActual =
                scoutData.Progresion?.toUpperCase() as Progresion;
            const religion = scoutData.Religion?.toUpperCase() as ReligionType;

            //Todo: Solucionar error en script que por defecto los pone en la pantera
            const patrullaId = (
                await prisma.patrulla.findFirst({
                    where: { nombre: scoutData.Patrulla },
                })
            )?.uuid;

            const id = nanoid(10)

            scouts.push({
                uuid: id,
                nombre,
                apellido,
                fechaNacimiento,
                progresionActual,
                patrullaId,
                funcion: funcion,
                sexo,
                religion,
                estado: scoutData.Estado?.toLocaleUpperCase() as EstadosType,
                dni: scoutData.Documento ?? "",
                localidad: scoutData.Localidad ?? "",
                direccion: scoutData.Calle ?? "",
                telefono: scoutData.Telefono,
                mail: scoutData.Email,
            });

            // Creamos familiares asociados al scout
            const familiaresData = Object.keys(scoutData)
                //@ts-ignore
                .filter((key) => VALID_RELATIONSHIPS.includes(key.toLocaleUpperCase()))
                .map((key) => ({ relacion: key as RelacionFamiliarType, name: scoutData[key as keyof ScoutXLSX] }));

            if (familiaresData.length) {
                const familiares: Prisma.FamiliarScoutCreateManyInput[] = [];

                for (const { name, relacion } of familiaresData) {
                    if (!name) continue
                    const [apellido, nombre] = name.split(", ");

                    const familiarId = (
                        await prisma.familiar.findFirst({
                            where: {
                                nombre: {
                                    contains: nombre
                                },
                                apellido: {
                                    contains: apellido
                                },
                            },
                        })
                    )?.uuid;

                    if (!familiarId) {
                        console.log(`El familiar con nombre: ${nombre} no existe en la bd`);
                        continue;
                    }

                    familiares.push({
                        familiarId,
                        relacion: relacion.toLocaleUpperCase() as RelacionFamiliarType,
                        scoutId: id
                    })

                    console.log(`\n-> Cargando ${familiares.length} familiares a la bd...`);
                    await prisma.$queryRaw`ALTER TABLE FamiliarScout AUTO_INCREMENT = 1`;
                    const result = await prisma.familiarScout.createMany({
                        data: familiares,
                        skipDuplicates: true,
                    });

                    console.log(`\n-> Se cargaron exitosamente ${result.count} familiares para el scout ${scoutData.Nombre} a la bd!\n`);
                }
            }

            // Actualizamos data dentro del usuario
            const scoutUser = dataUsers.find((user) => user.DNI === scoutData.Documento)


            if (scoutUser) {
                await prisma.user.update({
                    where: {
                        uuid: scoutUser.UserId
                    },
                    data: {
                        scoutId: id
                    }
                })
            }

            bar.tick(1);
        }

        console.log(`\n-> Cargando ${scouts.length} scouts a la bd...`);
        await prisma.$queryRaw`ALTER TABLE Scout AUTO_INCREMENT = 1`;
        const result = await prisma.scout.createMany({
            data: scouts,
            skipDuplicates: true,
        });

        console.log(`\n-> Se cararon exitosamente ${result.count} scouts a la bd!`);
        console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
        console.timeEnd("Tiempo de ejecucion");

    } catch (error) {
        console.log("Error en el script: ", (error as Error).message);
    } finally {
        await prisma.$disconnect();
    }
};

loadPagos();
