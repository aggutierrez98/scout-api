import { PrismaClient, Prisma } from "@prisma/client";
import ProgressBar from "progress";
import { SPLIT_STRING, excelDateToJSDate, parseDMYtoDate } from "../utils";
import { MetodosPagoType } from "../types";
import { nanoid } from "nanoid";
import { getSpreadSheetData } from "../utils/helpers/googleDriveApi";
// import { prisma } from "../utils/lib/prisma-client";

const loadPagos = async () => {
    const prisma = new PrismaClient();
    await prisma.$connect()

    // prisma.

    try {

        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO SCRIPT DE ACTUALIZACION PAGOS -------------\n",
        );

        const data = await getSpreadSheetData("pagos")

        const bar = new ProgressBar(
            "-> Leyendo pagos desde xlsx: [:bar] :percent - Tiempo restante: :etas",
            {
                total: data.length,
                width: 30,
            },
        );

        const pagos: Prisma.PagoCreateManyInput[] = [];
        let index = 0;
        for (const pagoData of data) {

            index++
            const [apellido, nombre] = pagoData.Scout!.toString().split(SPLIT_STRING);

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
                console.log(`\nEl scout con nombre: ${pagoData.Scout} (I: ${index}) no existe en la bd`);
                continue;
            }

            let fecha = new Date();
            if (typeof pagoData.Fecha === "number") {
                fecha = excelDateToJSDate(pagoData.Fecha)
            }
            if (typeof pagoData.Fecha === "string") {
                fecha = parseDMYtoDate(pagoData.Fecha)
            }

            pagos.push({
                uuid: nanoid(10),
                scoutId: scout.uuid,
                fechaPago: fecha,
                concepto: (pagoData.Concepto ?? "").toLocaleUpperCase(),
                metodoPago: pagoData["Metodo de pago"]!.toLocaleUpperCase() as MetodosPagoType,
                monto: Number(pagoData.Monto) ?? 0,
                rendido: pagoData.Rendido === "si",
            });

            bar.tick(1);
        }

        console.log(`\n-> Cargando ${pagos.length} pagos a la bd...`);
        // await prisma.$queryRaw`ALTER TABLE Pago AUTO_INCREMENT = 1`;
        await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'Pago'`;
        const result = await prisma.pago.createMany({
            data: pagos,
            // skipDuplicates: true,
        });

        console.log(`\n-> Se cararon exitosamente ${result.count} pagos a la bd!`);
        console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
        console.timeEnd("Tiempo de ejecucion");
    } catch (error) {
        console.log("Error en el script: ", (error as Error).message);
    } finally {
        await prisma.$disconnect();
    }
};

loadPagos();
