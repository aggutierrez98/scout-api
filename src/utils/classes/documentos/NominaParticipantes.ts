import { nanoid } from "nanoid";
import PizZip from "pizzip";
import { AppError, HttpCode } from "../AppError";
import { prismaClient } from "../../lib/prisma-client";
import { exportDocxBufferAsPdf, getFile, getSpreadSheetData } from "../../helpers/googleDriveApi";
import { renderDocxTemplate } from "../../lib/docx";
import { CATEGORIA_MIEMBRO_POR_RAMA, RAMA_LABELS } from "../../constants/nomina";
import { SecretsManager } from "../SecretsManager";
import type { NominaDocumentFormat, NominaDocumentoData } from "../../../types";
import {
	mapDocumentoDefinitionRow,
	normalizeDocumentoName,
} from "../../helpers/documentoSpreadsheet";

type EventoNominaRecord = {
	nombre: string;
	lugarNombre?: string | null;
	lugarDireccion: string;
	lugarLocalidad: string;
	lugarPartido: string;
	lugarProvincia: string;
	fechaHoraInicio: Date;
	fechaHoraFin: Date;
	participantes: Array<{
		tipoParticipante: string;
		scout: {
			uuid: string;
			nombre: string;
			apellido: string;
			fechaNacimiento: Date;
			dni: string;
			religion: string | null;
			telefono: string | null;
			rama: keyof typeof RAMA_LABELS | null;
			funcion: string | null;
		};
	}>;
};

interface ConstructorProps {
	eventoId: string
}

interface Data {
	eventoId: string
	evento?: EventoNominaRecord
	googleDriveFileId?: string
}

const NOMINA_TEMPLATE_ALIASES = [
	"nomina de participantes en salidas acantonamientos y/o campamentos",
	"nomina de participantes en salidas acantonamientos y/o campamentos",
	"nomina de participantes",
	"nomina participantes",
	"nomina modelo",
] as const;

export class NominaParticipantes {
	private data: Data
	private buffer: Buffer
	private uploadId: string
	private format: NominaDocumentFormat

	constructor({ eventoId }: ConstructorProps) {
		this.data = { eventoId }
		this.buffer = Buffer.from([])
		this.uploadId = nanoid()
		this.format = "docx"
	}

	private formatNominaDate(date?: Date | null) {
		if (!date) return "";
		return new Intl.DateTimeFormat("es-AR", {
			day: "2-digit",
			month: "2-digit",
			year: "2-digit",
		}).format(date);
	}

	private formatNominaDateRange(start?: Date | null, end?: Date | null) {
		if (!start && !end) return "";
		if (!start) return this.formatNominaDate(end);
		if (!end) return this.formatNominaDate(start);

		const formattedStart = this.formatNominaDate(start);
		const formattedEnd = this.formatNominaDate(end);

		return formattedStart === formattedEnd
			? formattedStart
			: `${formattedStart} al ${formattedEnd}`;
	}

	private toSentenceCase(value?: string | null) {
		if (!value) return "";
		const trimmedValue = value.trim();
		if (!trimmedValue) return "";

		return trimmedValue.charAt(0).toUpperCase() + trimmedValue.slice(1).toLowerCase();
	}

	private normalizeFilenameSegment(value: string) {
		return value
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-zA-Z0-9]+/g, "_")
			.replace(/^_+|_+$/g, "")
			.toLowerCase();
	}

	private getCategoriaMiembro({
		rama,
		funcion,
		tipoParticipante,
	}: {
		rama?: keyof typeof CATEGORIA_MIEMBRO_POR_RAMA | null
		funcion?: string | null
		tipoParticipante: string
	}) {
		if (tipoParticipante === "EDUCADOR") return "Educador";
		if (funcion && funcion !== "JOVEN") return this.toSentenceCase(funcion.replace(/_/g, " "));
		if (rama) return CATEGORIA_MIEMBRO_POR_RAMA[rama];
		return "";
	}

	private getRamaDocumento(ramas: Array<keyof typeof RAMA_LABELS>) {
		const uniqueRamas = Array.from(new Set(ramas));
		if (uniqueRamas.length === 0) return "";
		if (uniqueRamas.length === 1) return RAMA_LABELS[uniqueRamas[0]];
		return uniqueRamas.map((rama) => RAMA_LABELS[rama]).join(" / ");
	}

	private mapParticipanteConAlias(participante: {
		numero: string;
		nombreApellido: string;
		fechaNacimiento: string;
		dni: string;
		religion: string;
		telefono: string;
		categoriaMiembro: string;
	}) {
		const {
			numero,
			nombreApellido,
			fechaNacimiento,
			dni,
			religion,
			telefono,
			categoriaMiembro,
		} = participante;

		return {
			numero,
			nro: numero,
			Nro: numero,
			Numero: numero,
			NUMERO: numero,
			nombreApellido,
			nombre_apellido: nombreApellido,
			Nombre_apellido: nombreApellido,
			Nombre_Apellido: nombreApellido,
			fechaNacimiento,
			fecha_nacimiento: fechaNacimiento,
			Fecha_nacimiento: fechaNacimiento,
			dni,
			DNI: dni,
			religion,
			Religion: religion,
			telefono,
			Telefono: telefono,
			categoriaMiembro,
			categoria_miembro: categoriaMiembro,
			Categoria_miembro: categoriaMiembro,
			CategoriaMiembro: categoriaMiembro,
		};
	}

	private async resolveTemplateGoogleDriveFileId() {
		const documentos = await prismaClient.documento.findMany({
			where: { googleDriveFileId: { not: null } },
			select: { nombre: true, googleDriveFileId: true },
		});

		const documentoMatch = documentos.find((documento) => {
			const normalizedName = normalizeDocumentoName(documento.nombre);
			return NOMINA_TEMPLATE_ALIASES.some((alias) => normalizedName.includes(alias));
		});

		if (documentoMatch?.googleDriveFileId) return documentoMatch.googleDriveFileId;

		const docsData = (await getSpreadSheetData("docs-data")).map(
			mapDocumentoDefinitionRow,
		);
		const docsDataMatch = docsData.find((documento) => {
			const normalizedName = normalizeDocumentoName(documento.nombre);
			return NOMINA_TEMPLATE_ALIASES.some((alias) => normalizedName.includes(alias));
		});

		if (docsDataMatch?.googleDriveFileId) return docsDataMatch.googleDriveFileId;

		throw new AppError({
			name: "NOT_FOUND",
			description: "No se encontró el template de nómina de participantes configurado en Google Drive",
			httpCode: HttpCode.NOT_FOUND,
		});
	}

	async getData() {
		const evento = await prismaClient.evento.findUnique({
			where: { uuid: this.data.eventoId },
			include: {
				participantes: {
					include: {
						scout: {
							select: {
								uuid: true,
								nombre: true,
								apellido: true,
								fechaNacimiento: true,
								dni: true,
								religion: true,
								telefono: true,
								rama: true,
								funcion: true,
							},
						},
					},
				},
			},
		});

		if (!evento) throw new AppError({
			name: "NOT_FOUND",
			description: "Evento no encontrado",
			httpCode: HttpCode.NOT_FOUND,
		});

		if (evento.participantes.length === 0) throw new AppError({
			name: "BAD_REQUEST",
			description: "El evento no tiene participantes para exportar en la nómina",
			httpCode: HttpCode.BAD_REQUEST,
		});

		const googleDriveFileId = await this.resolveTemplateGoogleDriveFileId();

		this.data = {
			...this.data,
			evento: evento as EventoNominaRecord,
			googleDriveFileId,
		};
	}

	mapData(): NominaDocumentoData & Record<string, unknown> {
		const evento = this.data.evento;
		if (!evento) {
			throw new AppError({
				name: "BAD_REQUEST",
				description: "No hay datos del evento para completar la nómina",
				httpCode: HttpCode.BAD_REQUEST,
			});
		}
		const datosGrupo = SecretsManager.getInstance().getDatosGrupo();
		const participantesOrdenados = [...evento.participantes]
			.sort((a, b) => {
				const apellidoA = a.scout.apellido.localeCompare(b.scout.apellido, "es");
				if (apellidoA !== 0) return apellidoA;
				return a.scout.nombre.localeCompare(b.scout.nombre, "es");
			});

		const rama = this.getRamaDocumento(participantesOrdenados.map(({ scout }) => scout.rama).filter(Boolean) as Array<keyof typeof RAMA_LABELS>);
		const denominacionEncuentro = evento.nombre;
		const fecha = this.formatNominaDateRange(evento.fechaHoraInicio, evento.fechaHoraFin);
		const lugar = [evento.lugarNombre, evento.lugarDireccion, evento.lugarLocalidad, evento.lugarPartido, evento.lugarProvincia]
			.filter(Boolean)
			.join(", ");
		const grupoNombre = datosGrupo.nombre;
		const grupoNumero = datosGrupo.numero;
		const distrito = datosGrupo.distrito;
		const zona = datosGrupo.zona;
		const participantes = participantesOrdenados.map(({ scout, tipoParticipante }, index) =>
			this.mapParticipanteConAlias({
				numero: String(index + 1),
				nombreApellido: `${scout.apellido} ${scout.nombre}`.trim(),
				fechaNacimiento: this.formatNominaDate(scout.fechaNacimiento),
				dni: scout.dni,
				religion: this.toSentenceCase(scout.religion),
				telefono: scout.telefono || "",
				categoriaMiembro: this.getCategoriaMiembro({
					rama: scout.rama,
					funcion: scout.funcion,
					tipoParticipante,
				}),
			}),
		);

		return {
			rama,
			denominacionEncuentro,
			fecha,
			lugar,
			grupoNombre,
			grupoNumero,
			distrito,
			zona,
			participantes,

			// Alias para compatibilidad con templates históricos de Google Docs/Word
			Rama: rama,
			DenominacionEncuentro: denominacionEncuentro,
			Denominacion_encuentro: denominacionEncuentro,
			Fecha: fecha,
			Lugar: lugar,
			GS_nombre: grupoNombre,
			GS_Numero: grupoNumero,
			GS_numero_distrito: distrito,
			GS_numero_zona: zona,
			Participantes: participantes,
			participantesListado: participantes,
			listadoParticipantes: participantes,
			listado_participantes: participantes,
			filas: participantes,
			rows: participantes,
		};
	}

	private escapeXml(value: string) {
		return value
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&apos;");
	}

	private replaceAt(source: string, start: number, length: number, replacement: string) {
		return `${source.slice(0, start)}${replacement}${source.slice(start + length)}`;
	}

	private setCellText(cellXml: string, value: string) {
		if (!value) return cellXml;

		const escaped = this.escapeXml(value);
		return cellXml.replace(
			/(<w:p\b[^>]*>)([\s\S]*?)(<\/w:p>)/,
			(_match, openPTag: string, innerContent: string, closePTag: string) => (
				`${openPTag}${innerContent}<w:r><w:t xml:space="preserve">${escaped}</w:t></w:r>${closePTag}`
			),
		);
	}

	private getCellText(cellXml: string) {
		const matches = [...cellXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
		if (matches.length === 0) return "";

		return matches
			.map(([, text = ""]) => text)
			.join("")
			.replace(/&nbsp;/g, " ")
			.trim();
	}

	private getNumericRowNumber(rowXml: string) {
		const firstCellMatch = rowXml.match(/<w:tc(?:\s[^>]*)?>[\s\S]*?<\/w:tc>/);
		if (!firstCellMatch) return null;

		const firstCellText = this.getCellText(firstCellMatch[0]).replace(/\s+/g, "");
		if (!/^\d+$/.test(firstCellText)) return null;
		return Number(firstCellText);
	}

	private trimParticipantesTableRows(tableXml: string, participantesCount: number) {
		const rowMatches = [...tableXml.matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)];
		if (rowMatches.length === 0) return tableXml;

		const keptRows = rowMatches
			.map((match, index) => ({ rowXml: match[0], index }))
			.filter(({ rowXml, index }) => {
				if (index === 0) return true; // encabezado
				const rowNumber = this.getNumericRowNumber(rowXml);
				if (rowNumber == null) return true; // observaciones / firmas / filas no numeradas
				return rowNumber <= participantesCount;
			})
			.map(({ rowXml }) => rowXml);

		const rebuiltRows = keptRows.join("");
		return tableXml.replace(/<w:tr\b[\s\S]*?<\/w:tr>/g, "").replace("</w:tbl>", `${rebuiltRows}</w:tbl>`);
	}

	private updateTableCell(tableXml: string, rowIndex: number, cellIndex: number, value: string) {
		const rowMatches = [...tableXml.matchAll(/<w:tr\b[\s\S]*?<\/w:tr>/g)];
		const rowMatch = rowMatches[rowIndex];
		if (!rowMatch || rowMatch.index == null) return tableXml;

		const rowXml = rowMatch[0];
		const cellMatches = [...rowXml.matchAll(/<w:tc\b[\s\S]*?<\/w:tc>/g)];
		const cellMatch = cellMatches[cellIndex];
		if (!cellMatch || cellMatch.index == null) return tableXml;

		const updatedCellXml = this.setCellText(cellMatch[0], value);
		const updatedRowXml = this.replaceAt(
			rowXml,
			cellMatch.index,
			cellMatch[0].length,
			updatedCellXml,
		);

		return this.replaceAt(
			tableXml,
			rowMatch.index,
			rowMatch[0].length,
			updatedRowXml,
		);
	}

	private fillStaticNominaTemplate(templateBuffer: Buffer, data: NominaDocumentoData) {
		const zip = new PizZip(templateBuffer.toString("binary"));
		const documentFile = zip.file("word/document.xml");
		if (!documentFile) {
			throw new AppError({
				name: "BAD_REQUEST",
				description: "El template de nómina no contiene word/document.xml",
				httpCode: HttpCode.BAD_REQUEST,
			});
		}

		const originalDocumentXml = documentFile.asText();
		const tableMatches = [...originalDocumentXml.matchAll(/<w:tbl\b[^>]*>[\s\S]*?<\/w:tbl>/g)];
		if (tableMatches.length < 4) {
			throw new AppError({
				name: "BAD_REQUEST",
				description: "El template de nómina no tiene la estructura esperada",
				httpCode: HttpCode.BAD_REQUEST,
			});
		}

		const updatedTables = tableMatches.map((match) => match[0]);

		// Tabla 1 (RAMA / DENOMINACIÓN)
		updatedTables[0] = this.updateTableCell(updatedTables[0], 1, 0, data.rama);
		updatedTables[0] = this.updateTableCell(updatedTables[0], 1, 1, data.denominacionEncuentro);

		// Tabla 2 (FECHA / LUGAR)
		updatedTables[1] = this.updateTableCell(updatedTables[1], 2, 0, data.fecha);
		updatedTables[1] = this.updateTableCell(updatedTables[1], 2, 1, data.lugar);

		// Tabla 3 (datos del grupo)
		updatedTables[2] = this.updateTableCell(updatedTables[2], 2, 0, data.grupoNombre);
		updatedTables[2] = this.updateTableCell(updatedTables[2], 2, 1, data.grupoNumero);
		updatedTables[2] = this.updateTableCell(updatedTables[2], 2, 2, data.distrito);
		updatedTables[2] = this.updateTableCell(updatedTables[2], 2, 3, data.zona);

		// Tabla 4 (listado de participantes)
		const participantes = data.participantes;
		for (let i = 0; i < participantes.length; i++) {
			const participante = participantes[i];
			const tableRowIndex = i + 1; // fila 0 = encabezados

			updatedTables[3] = this.updateTableCell(updatedTables[3], tableRowIndex, 1, participante.nombreApellido);
			updatedTables[3] = this.updateTableCell(updatedTables[3], tableRowIndex, 2, participante.fechaNacimiento);
			updatedTables[3] = this.updateTableCell(updatedTables[3], tableRowIndex, 3, participante.dni);
			updatedTables[3] = this.updateTableCell(updatedTables[3], tableRowIndex, 4, participante.religion);
			updatedTables[3] = this.updateTableCell(updatedTables[3], tableRowIndex, 5, participante.telefono);
			updatedTables[3] = this.updateTableCell(updatedTables[3], tableRowIndex, 6, participante.categoriaMiembro);
		}

		updatedTables[3] = this.trimParticipantesTableRows(updatedTables[3], participantes.length);

		let rebuiltDocumentXml = "";
		let cursor = 0;
		for (let i = 0; i < tableMatches.length; i++) {
			const match = tableMatches[i];
			const start = match.index ?? 0;
			rebuiltDocumentXml += originalDocumentXml.slice(cursor, start);
			rebuiltDocumentXml += updatedTables[i];
			cursor = start + match[0].length;
		}
		rebuiltDocumentXml += originalDocumentXml.slice(cursor);

		zip.file("word/document.xml", rebuiltDocumentXml);
		return zip.generate({
			type: "nodebuffer",
			compression: "DEFLATE",
		});
	}

	async fill({ format = "docx" }: { format?: NominaDocumentFormat } = {}) {
		if (!this.data.googleDriveFileId) {
			throw new AppError({
				name: "BAD_REQUEST",
				description: "No se encontró el template de nómina configurado",
				httpCode: HttpCode.BAD_REQUEST,
			});
		}

		const templateFile = await getFile(this.data.googleDriveFileId);
		if (!templateFile) throw new AppError({
			name: "BAD_REQUEST",
			description: "No se pudo descargar el template de nómina desde Google Drive",
			httpCode: HttpCode.BAD_REQUEST,
		});

		const templateZip = new PizZip(templateFile.toString("binary"));
		const templateDocumentXml = templateZip.file("word/document.xml")?.asText() || "";
		const hasDocxtemplaterTags = /\{[#/A-Za-z0-9_.-]+\}/.test(templateDocumentXml);
		const nominaData = this.mapData();

		const docxBuffer = hasDocxtemplaterTags
			? await renderDocxTemplate(templateFile, nominaData)
			: this.fillStaticNominaTemplate(templateFile, nominaData);
		this.format = format;
		this.buffer = format === "pdf"
			? await exportDocxBufferAsPdf(docxBuffer, this.docxFileName)
			: docxBuffer;
	}

	private get baseFileName() {
		return `nomina_${this.normalizeFilenameSegment(this.data.evento?.nombre || "participantes")}_${this.uploadId}`
	}

	private get docxFileName() {
		return `${this.baseFileName}.docx`
	}

	get fileName() {
		return `${this.baseFileName}.${this.format}`
	}

	get contentType() {
		return this.format === "pdf"
			? "application/pdf"
			: "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
	}

	get dataBuffer() {
		return this.buffer;
	}
}
