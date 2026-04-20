import { Prisma } from "@prisma/client";
import ProgressBar from "progress";
import {
    PROGRESIONES_POR_RAMA,
    VALID_RAMAS,
    VALID_PROGRESSIONS,
    VALID_RELATIONSHIPS,
    excelDateToJSDate,
    parseDMYtoDate
} from "../../utils";
import { EstadosType, FuncionType, ProgresionType, RamasType, RelacionFamiliarType, ReligionType, ScoutXLSX } from "../../types";
import { nanoid } from "nanoid";
import { getSpreadSheetData } from "../../utils/helpers/googleDriveApi";
import { SecretsManager } from "../../utils/classes/SecretsManager";

const parseFullName = (
    fullName: unknown,
): { apellido: string; nombre: string } | null => {
    if (!fullName || typeof fullName !== "string") return null;
    const normalized = fullName.trim();
    if (!normalized) return null;

    // Formato "Apellido, Nombre"
    if (normalized.includes(",")) {
        const [apellidoRaw, ...nombreParts] = normalized
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);

        const nombreRaw = nombreParts.join(" ").trim();
        if (!apellidoRaw || !nombreRaw) return null;
        return { apellido: apellidoRaw, nombre: nombreRaw };
    }

    // Formato "Apellido Nombre" / "Apellido Nombre Segundo"
    const parts = normalized.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return null;

    const [apellido, ...nombreParts] = parts;
    const nombre = nombreParts.join(" ").trim();
    if (!apellido || !nombre) return null;

    return { apellido, nombre };
};

export const loadScouts = async () => {
    let prismaClient;

    try {
        console.time("Tiempo de ejecucion");
        console.log("------------ INICIANDO SCRIPT DE ACTUALIZACION SCOUTS -------------\n");

        await SecretsManager.getInstance().initialize();
        prismaClient = (await import("../../utils/lib/prisma-client")).prismaClient;
        if (!prismaClient) {
            throw new Error("Prisma Client no inicializado");
        }

        await prismaClient.$connect();


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
            index++

            const parsedScoutName = parseFullName(scoutData.Nombre);
            if (!parsedScoutName) {
                console.warn(
                    `\n⚠️  Fila inválida de scout (I: ${index}) sin nombre parseable: "${scoutData.Nombre ?? ""}". Se omite.`,
                );
                bar.tick(1);
                continue;
            }
            const { apellido, nombre } = parsedScoutName;

            let fechaNacimiento = new Date();
            if (typeof scoutData["Fecha Nacimiento"] === "number") {
                fechaNacimiento = excelDateToJSDate(scoutData["Fecha Nacimiento"])
            }
            if (typeof scoutData["Fecha Nacimiento"] === "string") {
                fechaNacimiento = parseDMYtoDate(scoutData["Fecha Nacimiento"])
            }

            const sexo = scoutData.Sexo === "Masculino" ? "M" : "F";
            const funcion = (scoutData.Funcion?.toLocaleUpperCase() as FuncionType) || "COLABORADOR"
            const religion = scoutData.Religion?.toUpperCase() as ReligionType;
            const ramaRaw = scoutData.Rama?.toLocaleUpperCase();
            const rama = (
                ramaRaw && VALID_RAMAS.includes(ramaRaw as RamasType)
                    ? (ramaRaw as RamasType)
                    : undefined
            );

            // Normalizaciones de planilla (ej: "PISTA" -> "PISTAS")
            const progresionRaw = scoutData.Progresion
                ?.toUpperCase()
                ?.replace(/\s/g, "_")
                ?.trim();
            const progresionNormalized =
                progresionRaw === "PISTA" ? "PISTAS" : progresionRaw;

            let progresionActual: ProgresionType | undefined = undefined;
            if (
                progresionNormalized &&
                VALID_PROGRESSIONS.includes(progresionNormalized as ProgresionType)
            ) {
                progresionActual = progresionNormalized as ProgresionType;
            }

            // Si no existe en enum de Prisma, se ignora para no romper createMany
            if (progresionNormalized && !progresionActual) {
                console.warn(
                    `\n⚠️  Progresion inválida "${progresionNormalized}" (dni: ${scoutData.Documento}). Se guarda como null.`,
                );
            }

            // Alinea progresión con rama para no guardar combinaciones inconsistentes
            if (
                rama &&
                progresionActual &&
                !PROGRESIONES_POR_RAMA[rama].includes(progresionActual as never)
            ) {
                console.warn(
                    `\n⚠️  Progresion "${progresionActual}" no corresponde a rama "${rama}" (dni: ${scoutData.Documento}). Se guarda como null.`,
                );
                progresionActual = undefined;
            }

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
                rama,
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
                    const parsedFamiliarName = parseFullName(name);
                    if (!parsedFamiliarName) {
                        console.warn(
                            `\n⚠️  Nombre de familiar inválido "${String(name)}" (I-scout: ${index}). Se omite.`,
                        );
                        continue;
                    }
                    const { apellido, nombre } = parsedFamiliarName;

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
        throw error;
    } finally {
        if (prismaClient) {
            await prismaClient.$disconnect();
        }
    }
};

// loadScouts();
