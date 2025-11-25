import { Prisma } from "@prisma/client";
import ProgressBar from "progress";
import { SPLIT_STRING, VALID_RELATIONSHIPS, excelDateToJSDate, parseDMYtoDate } from "../utils";
import { EstadosType, FuncionType, ProgresionType, RelacionFamiliarType, ReligionType, ScoutXLSX } from "../types";
import { nanoid } from "nanoid";
import { getSpreadSheetData } from "../utils/helpers/googleDriveApi";
import { prismaClient } from "../utils/lib/prisma-client";

export const loadScouts = async () => {

    try {
        console.time("Tiempo de ejecucion");
        console.log("------------ INICIANDO SCRIPT DE ACTUALIZACION SCOUTS -------------\n");

        const data = await getSpreadSheetData("scouts")
        const dataUsers = await getSpreadSheetData("usuarios")

        const bar = new ProgressBar(
            "-> Cargando scouts desde xlsx hacia BD: [:bar] :percent - Tiempo restante: :etas",
            {
                total: data.length,
                width: 30,
            },
        );

        let index = 0
        const scouts: Prisma.ScoutCreateManyInput[] = [];
        const familiares: Prisma.FamiliarScoutCreateManyInput[] = [];
        for (const scoutData of data) {

            const [apellido, nombre] = scoutData.Nombre!.split(SPLIT_STRING);

            let fechaNacimiento = new Date();
            if (typeof scoutData["Fecha Nacimiento"] === "number") {
                fechaNacimiento = excelDateToJSDate(scoutData["Fecha Nacimiento"])
            }
            if (typeof scoutData["Fecha Nacimiento"] === "string") {
                fechaNacimiento = parseDMYtoDate(scoutData["Fecha Nacimiento"])
            }

            const sexo = scoutData.Sexo === "Masculino" ? "M" : "F";
            const funcion = (scoutData.Funcion?.toLocaleUpperCase() as FuncionType) || "COLABORADOR"
            const progresionActual =
                scoutData.Progresion?.toUpperCase() as ProgresionType;
            const religion = scoutData.Religion?.toUpperCase() as ReligionType;

            //Todo: Solucionar error en script que por defecto los pone en la pantera
            const equipoId = (
                await prismaClient.equipo.findFirst({
                    where: { nombre: scoutData.Equipo },
                })
            )?.uuid;

            const id = nanoid(10)

            scouts.push({
                uuid: id,
                nombre,
                apellido,
                fechaNacimiento,
                progresionActual,
                equipoId,
                funcion: funcion,
                sexo,
                religion,
                rama: scoutData.Rama?.toLocaleUpperCase(),
                estado: scoutData.Estado?.toLocaleUpperCase() as EstadosType,
                dni: scoutData.Documento ?? "",
                localidad: scoutData.Localidad ?? "",
                nacionalidad: scoutData.Nacionalidad ?? "",
                provincia: scoutData.Provincia ?? "",
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


                for (const { name, relacion } of familiaresData) {
                    if (!name) continue
                    const [apellido, nombre] = name.split(SPLIT_STRING);

                    const familiarId = (
                        await prismaClient.familiar.findFirst({
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
                        console.log(`\nEl familiar con nombre: "${nombre}" con relacion ${relacion} no existe en la bd. (I-scout: ${index})`);
                        continue;
                    }

                    familiares.push({
                        familiarId,
                        relacion: relacion.toLocaleUpperCase() as RelacionFamiliarType,
                        scoutId: id
                    })
                }
            }

            // Actualizamos data dentro del usuario
            const scoutUser = dataUsers.find((user) => user.DNI === scoutData.Documento)

            if (scoutUser) {
                await prismaClient.user.update({
                    where: {
                        uuid: scoutUser.UserId
                    },
                    data: {
                        scoutId: id,
                    }
                })
            }

            index++
            bar.tick(1);
        }

        console.log(`\n-> Cargando ${scouts.length} scouts a la bd...`);
        // await prismaClient.$queryRaw`ALTER TABLE Scout AUTO_INCREMENT = 1`;
        await prismaClient.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'Scout'`;
        const scoutsResult = await prismaClient.scout.createMany({
            data: scouts,
            // skipDuplicates: true,
        });

        // await prismaClient.$queryRaw`ALTER TABLE FamiliarScout AUTO_INCREMENT = 1`;
        await prismaClient.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'FamiliarScout'`;
        const familiaresResult = await prismaClient.familiarScout.createMany({
            data: familiares,
            // skipDuplicates: true,
        });

        console.log(`\n-> Se cararon exitosamente ${scoutsResult.count} scouts a la bd!`);
        console.log(`\n-> Se cargaron exitosamente ${familiaresResult.count} familiares a la bd!`);
        console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
        console.timeEnd("Tiempo de ejecucion");

    } catch (error) {
        console.error("Error en el script: ", (error as Error).message);
    } finally {
        await prismaClient.$disconnect();
    }
};

// loadScouts();
