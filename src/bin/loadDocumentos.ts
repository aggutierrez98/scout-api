import { PrismaClient, Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import ProgressBar from "progress";
import { excelDateToJSDate, parseDMYtoDate } from "../utils";
import { DocumentoXLSX } from "../types";
import { nanoid } from "nanoid";
const prisma = new PrismaClient();

const loadDocumentos = async () => {
    try {
        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO SCRIPT DE ACTUALIZACION DOCUMENTOS -------------\n",
        );

        const file = XLSX.readFile("dbdata/documentos.xlsx");
        const sheet = file.Sheets[file.SheetNames[0]];
        const data: DocumentoXLSX[] = XLSX.utils.sheet_to_json(sheet);

        const bar = new ProgressBar(
            "-> Leyendo documentos desde xlsx: [:bar] :percent - Tiempo restante: :etas",
            {
                total: data.length,
                width: 30,
            },
        );

        const documentos: Prisma.DocumentoPresentadoCreateManyInput[] = [];
        let index = 0;
        for (const documentoXLSX of data) {
            index++
            const [nombre, apellido] = documentoXLSX.Scout.toString().split(" ")

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

            const documento = (
                await prisma.documento.findFirst({
                    where: {
                        nombre: {
                            contains: documentoXLSX.Documento
                        },
                    },
                })
            );

            if (!scout) {
                console.log(`El scout con nombre: ${documentoXLSX.Scout} (I: ${index}) no existe en la bd`);
                continue;
            }
            if (!documento) {
                console.log(`El documento con nombre: ${documentoXLSX.Documento} (I: ${index}) no existe en la bd`);
                continue;
            }

            let fecha = new Date();

            if (typeof documentoXLSX.Fecha === "number") {
                fecha = excelDateToJSDate(documentoXLSX.Fecha)
            }
            if (typeof documentoXLSX.Fecha === "string") {
                fecha = parseDMYtoDate(documentoXLSX.Fecha)
            }

            documentos.push({
                uuid: nanoid(10),
                scoutId: scout.uuid,
                documentoId: documento.uuid,
                fechaPresentacion: fecha
            });

            bar.tick(1);
        }

        console.log(`\n-> Cargando ${documentos.length} documentos a la bd...`);
        const result = await prisma.documentoPresentado.createMany({
            data: documentos,
            skipDuplicates: true,
        });

        console.log(`\n-> Se cararon exitosamente ${result.count} documentos a la bd!`);
        console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
        console.timeEnd("Tiempo de ejecucion");
    } catch (error) {
        console.log("Error en el script: ", (error as Error).message);
    } finally {
        await prisma.$disconnect();
    }
};

loadDocumentos();
