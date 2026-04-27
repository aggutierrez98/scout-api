import { Prisma } from "@prisma/client";
import ProgressBar from "progress";
import { excelDateToJSDate, parseDMYtoDate } from "../../utils";
import { nanoid } from "nanoid";
import { getSpreadSheetData } from "../../utils/helpers/googleDriveApi";
import { SecretsManager } from "../../utils/classes/SecretsManager";
import {
	mapDocumentoDefinitionRow,
	normalizeDocumentoName,
} from "../../utils/helpers/documentoSpreadsheet";

const buildScoutLookupKeys = ({
	nombre,
	apellido,
}: {
	nombre: string;
	apellido: string;
}) => {
	const nombreApellido = normalizeDocumentoName(`${nombre} ${apellido}`);
	const apellidoNombre = normalizeDocumentoName(`${apellido} ${nombre}`);
	return Array.from(new Set([nombreApellido, apellidoNombre].filter(Boolean)));
};

const parseFechaDocumento = (fecha: unknown) => {
	if (typeof fecha === "number") return excelDateToJSDate(fecha);
	if (typeof fecha === "string") return parseDMYtoDate(fecha);
	return new Date();
};

export const loadDocumentos = async () => {
	let prismaClient;

	try {
		console.time("Tiempo de ejecucion");
		console.log(
			"------------ INICIANDO SCRIPT DE ACTUALIZACION DOCUMENTOS -------------\n",
		);

		await SecretsManager.getInstance().initialize();
		prismaClient = (await import("../../utils/lib/prisma-client")).prismaClient;
		if (!prismaClient) {
			throw new Error("Prisma Client no inicializado");
		}

		const documentosPresentadosSheet = await getSpreadSheetData("documentos");
		const documentosDefinitionRows = (await getSpreadSheetData("docs-data")).map(
			mapDocumentoDefinitionRow,
		);

		const bar = new ProgressBar(
			"-> Leyendo documentos desde xlsx: [:bar] :percent - Tiempo restante: :etas",
			{
				total: documentosPresentadosSheet.length,
				width: 30,
			},
		);

		const documentosExistentes = await prismaClient.documento.findMany();
		const documentosPorNombre = new Map(
			documentosExistentes.map((documento) => [
				normalizeDocumentoName(documento.nombre),
				documento,
			]),
		);

		for (const documentoDefinition of documentosDefinitionRows) {
			const normalizedName = normalizeDocumentoName(documentoDefinition.nombre);
			const documentoExistente = documentosPorNombre.get(normalizedName);

			if (documentoExistente) {
				const documentoActualizado = await prismaClient.documento.update({
					where: { uuid: documentoExistente.uuid },
					data: documentoDefinition,
				});
				documentosPorNombre.set(normalizedName, documentoActualizado);
				continue;
			}

			const documentoCreado = await prismaClient.documento.create({
				data: {
					uuid: nanoid(10),
					...documentoDefinition,
				},
			});
			documentosPorNombre.set(normalizedName, documentoCreado);
		}

		console.log(
			`\n-> Tipos de documentos sincronizados desde docs-data: ${documentosDefinitionRows.length}`,
		);

		const nombresSeed = new Set(
			documentosDefinitionRows.map(({ nombre }) => normalizeDocumentoName(nombre)),
		);
		const documentosFueraDeSheet = documentosExistentes.filter(
			(documento) => !nombresSeed.has(normalizeDocumentoName(documento.nombre)),
		);

		if (documentosFueraDeSheet.length > 0) {
			console.log(
				`\n-> Aviso: hay ${documentosFueraDeSheet.length} documentos en BD que no están en docs-data. No se eliminan automáticamente.`,
			);
		}

		const scouts = await prismaClient.scout.findMany({
			select: { uuid: true, nombre: true, apellido: true },
		});

		const scoutsPorNombre = new Map<string, { uuid: string }>();
		for (const scout of scouts) {
			for (const key of buildScoutLookupKeys(scout)) {
				scoutsPorNombre.set(key, { uuid: scout.uuid });
			}
		}

		await prismaClient.documentoPresentado.deleteMany();
		await prismaClient.$executeRaw`DELETE FROM sqlite_sequence WHERE name = 'DocumentoPresentado'`;

		const documentosPresentados: Prisma.DocumentoPresentadoCreateManyInput[] = [];
		let index = 0;

		for (const documentoRow of documentosPresentadosSheet) {
			if (!documentoRow.Documento || !documentoRow.Fecha || !documentoRow.Scout) {
				bar.tick(1);
				continue;
			}

			index++;

			const scout = scoutsPorNombre.get(
				normalizeDocumentoName(documentoRow.Scout?.toString()),
			);
			const documento = documentosPorNombre.get(
				normalizeDocumentoName(documentoRow.Documento?.toString()),
			);

			if (!scout) {
				console.log(
					`\nEl scout con nombre: ${documentoRow.Scout} (I: ${index}) no existe en la bd`,
				);
				bar.tick(1);
				continue;
			}

			if (!documento) {
				console.log(
					`\nEl documento con nombre: ${documentoRow.Documento} (I: ${index}) no existe en la bd`,
				);
				bar.tick(1);
				continue;
			}

			documentosPresentados.push({
				uuid: nanoid(10),
				scoutId: scout.uuid,
				documentoId: documento.uuid,
				fechaPresentacion: parseFechaDocumento(documentoRow.Fecha),
			});

			bar.tick(1);
		}

		console.log(
			`\n-> Cargando ${documentosPresentados.length} documentos presentados a la bd...`,
		);
		const result = await prismaClient.documentoPresentado.createMany({
			data: documentosPresentados,
		});
		console.log(
			`\n-> Se cargaron exitosamente ${result.count} documentos presentados a la bd!`,
		);

		console.log("\n------------ ACTUALIZACION TERMINADA -------------\n");
		console.timeEnd("Tiempo de ejecucion");
	} catch (error) {
		console.error("Error en el script: ", error as Error);
	} finally {
		if (prismaClient) {
			await prismaClient.$disconnect();
		}
	}
};

// loadDocumentos();
