import { PrismaClient, Prisma } from "@prisma/client";
import ProgressBar from "progress";
import { excelDateToJSDate, parseDMYtoDate } from "../utils";
import { MetodosPagoType, PagoXLSX } from "../types";
import { nanoid } from "nanoid";
import { getDoc } from "../utils/helpers/googleDriveApi";

const loadPagos = async () => {
    const prisma = new PrismaClient();
    await prisma.$connect()

    try {

        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO SCRIPT DE ACTUALIZACION PAGOS -------------\n",
        );

        const doc = await getDoc(process.env.GOOGLE_PAGOS_SPREADSHEET_KEY!)
        const sheet = doc.sheetsByIndex[0];
        const data = await sheet.getRows<PagoXLSX>();

        const bar = new ProgressBar(
            "-> Leyendo pagos desde xlsx: [:bar] :percent - Tiempo restante: :etas",
            {
                total: data.length,
                width: 30,
            },
        );

        const pagos: Prisma.PagoCreateManyInput[] = [];
        let index = 0;
        for (const pagoSheetData of data) {
            const pagoData = pagoSheetData.toObject()

            index++
            const [apellido, nombre] = pagoData.Scout!.toString().split(", ")

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
                console.log(`El scout con nombre: ${pagoData.Scout} (I: ${index}) no existe en la bd`);
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
                monto: pagoData.Monto ?? "",
                rendido: pagoData.Rendido === "si",
            });

            bar.tick(1);
        }

        console.log(`\n-> Cargando ${pagos.length} pagos a la bd...`);
        await prisma.$queryRaw`ALTER TABLE Pago AUTO_INCREMENT = 1`;
        const result = await prisma.pago.createMany({
            data: pagos,
            skipDuplicates: true,
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
