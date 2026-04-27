import { AppError, HttpCode } from "../classes/AppError";
import type {
	DocumentoDefinitionSpreadsheetRow,
	DocumentoSeedDefinition,
	DocumentoSpreadsheetBoolean,
} from "../../types";

const normalizeText = (value?: string | null) =>
	(value || "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-zA-Z0-9]+/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.toLowerCase();

export const normalizeDocumentoName = (value?: string | null) => normalizeText(value);

export const parseSpreadsheetBoolean = (
	value: DocumentoSpreadsheetBoolean | undefined,
	fieldName: string,
) => {
	if (value === "Si") return true;
	if (value === "No" || value === "") return false;

	throw new AppError({
		name: "INVALID_SPREADSHEET_VALUE",
		description: `Valor inválido para '${fieldName}': ${String(value)}`,
		httpCode: HttpCode.BAD_REQUEST,
	});
};

export const mapDocumentoDefinitionRow = (
	row: Partial<DocumentoDefinitionSpreadsheetRow>,
): DocumentoSeedDefinition => {
	const nombre = row["Nombre del documento"]?.trim();

	if (!nombre) {
		throw new AppError({
			name: "INVALID_SPREADSHEET_VALUE",
			description: "La hoja docs-data contiene una fila sin 'Nombre del documento'",
			httpCode: HttpCode.BAD_REQUEST,
		});
	}

	const completableDinamicamente = parseSpreadsheetBoolean(
		row["Completable dinamicamente"],
		"Completable dinamicamente",
	);
	const googleDriveFileId =
		row["Id carga de archivo en google drive"]?.trim() || null;

	if (completableDinamicamente && !googleDriveFileId) {
		throw new AppError({
			name: "INVALID_SPREADSHEET_VALUE",
			description: `El documento '${nombre}' es completable dinamicamente pero no tiene 'Id carga de archivo en google drive'`,
			httpCode: HttpCode.BAD_REQUEST,
		});
	}

	return {
		nombre,
		requiereRenovacionAnual: parseSpreadsheetBoolean(
			row["Requiere renovacion anual"],
			"Requiere renovacion anual",
		),
		requeridoParaIngreso: parseSpreadsheetBoolean(
			row["Requerido para ingreso"],
			"Requerido para ingreso",
		),
		completableDinamicamente,
		googleDriveFileId,
		requiereFirmaFamiliar: parseSpreadsheetBoolean(
			row["Requiere firma del familiar"],
			"Requiere firma del familiar",
		),
		requiereDatosFamiliar: parseSpreadsheetBoolean(
			row["Requiere datos del familiar"],
			"Requiere datos del familiar",
		),
	};
};
