import { PrismaClient, Prisma } from "@prisma/client";
import ProgressBar from "progress";
import { SPLIT_STRING, VALID_ENTREGAS_TYPE, excelDateToJSDate, parseDMYtoDate } from "../utils";
import { nanoid } from "nanoid";
import { getSpreadSheetData } from "../utils/helpers/googleDriveApi";

const loadEntregas = async () => {
    const prisma = new PrismaClient();
    await prisma.$connect()

    try {
        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO SCRIPT DE ACTUALIZACION ENTREGAS -------------\n",
        );

        const data = await getSpreadSheetData("entregas")

        const bar = new ProgressBar(
            `-> Leyendo ${data.length} entregas desde xlsx: [:bar] :percent - Tiempo restante: :etas`,
            {
                total: data.length,
                width: 30,
            },
        );

        const entregas: Prisma.EntregaRealizadaCreateManyInput[] = [];
        let index = 0;
        for (const entregaData of data) {
            if (!entregaData["Tipo de entrega"] || !entregaData.Fecha || !entregaData.Scout) continue;

            index++
            const [apellido, nombre] = entregaData.Scout!.toString().split(SPLIT_STRING);

            const scout = (
                await prisma.scout.findFirst({
                    where: {
                        OR: [
                            {
                                nombre: {
                                    contains: nombre
                                },
                            },
                            {
                                apellido: {
                                    contains: apellido
                                },
                            }
                        ]
                    },
                })
            );

            if (!scout) {
                console.log(`\nEl scout con nombre: ${entregaData.Scout} (I: ${index}) no existe en la bd`);
                continue;
            }

            let fecha = new Date();
            if (typeof entregaData.Fecha === "number") {
                fecha = excelDateToJSDate(entregaData.Fecha)
            }
            if (entregaData.Fecha && typeof entregaData.Fecha === "string") {
                fecha = parseDMYtoDate(entregaData.Fecha)
            }

            const tipoEntrega = VALID_ENTREGAS_TYPE.find(entregaType => entregaType.includes(entregaData["Tipo de entrega"]!.toLocaleUpperCase()))
            if (!tipoEntrega) {
                console.log(`\nEl tipo de entrega ingresado como: ${entregaData["Tipo de entrega"]} (I: ${index}) no existe en la bd`);
                continue;
            }

            entregas.push({
                uuid: nanoid(10),
                scoutId: scout.uuid,
                fechaEntrega: fecha,
                tipoEntrega,
            });

            bar.tick(1);
        }

        console.log(`\n-> Cargando ${entregas.length} entregas a la bd...`);
        // await prisma.$queryRaw`ALTER TABLE EntregaRealizada AUTO_INCREMENT = 1`;
        await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'EntregaRealizada'`;
        const result = await prisma.entregaRealizada.createMany({
            data: entregas,
            // skipDuplicates: true,
        });

        console.log(`\n-> Se cararon exitosamente ${result.count} entregas a la bd!`);
        console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
        console.timeEnd("Tiempo de ejecucion");
    } catch (error) {
        console.error("Error en el script: ", error);
    } finally {
        await prisma.$disconnect();
    }
};

loadEntregas();
