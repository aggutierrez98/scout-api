import { PrismaClient, Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import ProgressBar from "progress";
import { VALID_ENTREGAS_TYPE, excelDateToJSDate, parseDMYtoDate } from "../utils";
import { TipoEntregaType, EntregaXLSX } from "../types";
import { nanoid } from "nanoid";
const prisma = new PrismaClient();
const loaentregas = async () => {
    try {
        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO SCRIPT DE ACTUALIZACION ENTREGAS -------------\n",
        );

        const file = XLSX.readFile("dbdata/entregas.xlsx");
        const sheet = file.Sheets[file.SheetNames[0]];
        const data: EntregaXLSX[] = XLSX.utils.sheet_to_json(sheet);

        const bar = new ProgressBar(
            "-> Leyendo entregas desde xlsx: [:bar] :percent - Tiempo restante: :etas",
            {
                total: data.length,
                width: 30,
            },
        );

        const entregas: Prisma.EntregaRealizadaCreateManyInput[] = [];
        let index = 0;
        for (const entregaXLSX of data) {
            index++
            const [nombre, apellido] = entregaXLSX.Scout.toString().split(" ")

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
                console.log(`El scout con nombre: ${entregaXLSX.Scout} (I: ${index}) no existe en la bd`);
                continue;
            }

            let fecha = new Date();
            if (typeof entregaXLSX.Fecha === "number") {
                fecha = excelDateToJSDate(entregaXLSX.Fecha)
            }
            if (typeof entregaXLSX.Fecha === "string") {
                fecha = parseDMYtoDate(entregaXLSX.Fecha)
            }

            const tipoEntrega = VALID_ENTREGAS_TYPE.find(entregaType => entregaType.includes(entregaXLSX["Tipo de entrega"].toLocaleUpperCase()))
            if (!tipoEntrega) {
                console.log(`El tipo de entrega ingresado como: ${entregaXLSX["Tipo de entrega"]} (I: ${index}) no existe en la bd`);
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
        await prisma.$queryRaw`ALTER TABLE EntregaRealizada AUTO_INCREMENT = 1`;
        const result = await prisma.entregaRealizada.createMany({
            data: entregas,
            skipDuplicates: true,
        });

        console.log(`\n-> Se cararon exitosamente ${result.count} entregas a la bd!`);
        console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
        console.timeEnd("Tiempo de ejecucion");
    } catch (error) {
        console.log("Error en el script: ", (error as Error).message);
    } finally {
        await prisma.$disconnect();
    }
};

loaentregas();
