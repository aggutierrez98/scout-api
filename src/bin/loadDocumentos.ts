import { Prisma } from "@prisma/client";
import ProgressBar from "progress";
import { SPLIT_STRING, excelDateToJSDate, parseDMYtoDate } from "../utils";
import { nanoid } from "nanoid";
import { getSpreadSheetData } from "../utils/helpers/googleDriveApi";
import { SecretsManager } from "../utils/classes/SecretsManager";

export const loadDocumentos = async () => {

    let prismaClient

    try {
        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO SCRIPT DE ACTUALIZACION DOCUMENTOS -------------\n",
        );

        await SecretsManager.getInstance().initialize();
        prismaClient = (await import("../utils/lib/prisma-client")).prismaClient;
        if (!prismaClient) {
            throw new Error("Prisma Client no inicializado");
        }

        const data = await getSpreadSheetData("documentos")
        const docsdata = await getSpreadSheetData("docs-data")

        const bar = new ProgressBar(
            "-> Leyendo documentos desde xlsx: [:bar] :percent - Tiempo restante: :etas",
            {
                total: data.length,
                width: 30,
            },
        );

        const documentosData: Prisma.DocumentoCreateManyInput[] = [];
        const documentos: Prisma.DocumentoPresentadoCreateManyInput[] = [];

        for (const docData of docsdata) {
            documentosData.push({
                uuid: nanoid(10),
                nombre: docData.Nombre!,
                vence: docData.Vence === "Si",
                completable: docData.Completable === "Si",
                requiereFamiliar: docData["Requiere familiar"] === "Si",
                requiereFirma: docData["Requiere firma"] === "Si",
                fileUploadId: docData["Id carga de archivo"],
            });
        }

        console.log(`\n-> Cargando ${documentosData.length} tipos de documentos a la bd...`);
        // await prisma.$queryRaw`ALTER TABLE Documento AUTO_INCREMENT = 1`;
        await prismaClient.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'Documento'`;
        const docs = await prismaClient.documento.createMany({
            data: documentosData,
            // skipDuplicates: true,
        });
        console.log(`\n-> Se cararon exitosamente ${docs.count} tipos de documento a la bd!`);

        let index = 0;
        for (const documentoData of data) {
            if (!documentoData.Documento || !documentoData.Fecha || !documentoData.Scout) continue;

            index++
            const [apellido, nombre] = documentoData.Scout!.toString().split(SPLIT_STRING)


            const scout = (
                await prismaClient.scout.findFirst({
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
                await prismaClient.documento.findFirst({
                    where: {
                        nombre: {
                            contains: documentoData.Documento
                        },
                    },
                })
            );

            if (!scout) {
                console.log(`\nEl scout con nombre: ${documentoData.Scout} (I: ${index}) no existe en la bd`);
                continue;
            }
            if (!documento) {
                console.log(`\nEl documento con nombre: ${documentoData.Documento} (I: ${index}) no existe en la bd`);
                continue;
            }

            let fecha = new Date();

            if (typeof documentoData.Fecha === "number") {
                fecha = excelDateToJSDate(documentoData.Fecha)
            }
            if (typeof documentoData.Fecha === "string") {
                fecha = parseDMYtoDate(documentoData.Fecha)
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
        // await prismaClient.$queryRaw`ALTER TABLE DocumentoPresentado AUTO_INCREMENT = 1`;
        await prismaClient.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'DocumentoPresentado'`;
        const result = await prismaClient.documentoPresentado.createMany({
            data: documentos,
            // skipDuplicates: true,
        });
        console.log(`\n-> Se cararon exitosamente ${result.count} documentos a la bd!`);

        console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
        console.timeEnd("Tiempo de ejecucion");
    } catch (error) {
        console.error("Error en el script: ", (error as Error));
    } finally {
        if (prismaClient) {
            await prismaClient.$disconnect();
        }
    }
};

// loadDocumentos();
