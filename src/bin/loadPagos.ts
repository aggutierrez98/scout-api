import { PrismaClient, Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import ProgressBar from "progress";
import { excelDateToJSDate, parseDMYtoDate } from "../utils";
import { MetodosPagoType, PagoXLSX } from "../types";
import { nanoid } from "nanoid";
const prisma = new PrismaClient();
const loadPagos = async () => {
    try {
        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO SCRIPT DE ACTUALIZACION PAGOS -------------\n",
        );

        const file = XLSX.readFile("dbdata/pagos.xlsx");
        const sheet = file.Sheets[file.SheetNames[0]];
        const data: PagoXLSX[] = XLSX.utils.sheet_to_json(sheet);

        const bar = new ProgressBar(
            "-> Leyendo pagos desde xlsx: [:bar] :percent - Tiempo restante: :etas",
            {
                total: data.length,
                width: 30,
            },
        );

        const pagos: Prisma.PagoCreateManyInput[] = [];
        let index = 0;
        for (const pagoXLSX of data) {
            index++
            const [nombre, apellido] = pagoXLSX.Scout.toString().split(" ")

            const scout = (
                await prisma.scout.findFirst({
                    where: {
                        nombre: {
                            contains: nombre
                        },
                        apellido: {
                            contains: apellido
                        },
                    },
                })
            );

            if (!scout) {
                console.log(`El scout con nombre: ${pagoXLSX.Scout} (I: ${index}) no existe en la bd`);
                continue;
            }

            let fecha = new Date();
            if (typeof pagoXLSX.Fecha === "number") {
                fecha = excelDateToJSDate(pagoXLSX.Fecha)
            }
            if (typeof pagoXLSX.Fecha === "string") {
                fecha = parseDMYtoDate(pagoXLSX.Fecha)
            }

            pagos.push({
                uuid: nanoid(10),
                scoutId: scout.uuid,
                fechaPago: fecha,
                concepto: pagoXLSX.Concepto.toLocaleUpperCase(),
                metodoPago: pagoXLSX["Metodo de pago"].toLocaleUpperCase() as MetodosPagoType,
                monto: pagoXLSX.Monto,
                rendido: pagoXLSX.Rendido === "si",
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
