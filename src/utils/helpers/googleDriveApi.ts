import { GoogleSpreadsheet } from 'google-spreadsheet';
import { auth, JWT } from 'google-auth-library';
import {
    DocumentoDefinitionSpreadsheetRow,
    DocumentoPresentadoSpreadsheetRow,
    EntregaXLSX,
    FamiliarXLSX,
    PagoXLSX,
    EquipoXLSX,
    ScoutXLSX,
    SheetIndexType,
    SpreadsheetDataMap,
    UsuarioXLSX
} from '../../types';
import { google } from 'googleapis';
import { createWriteStream } from 'fs';
import { Readable, Stream } from 'stream';
import { SecretsManager } from '../classes/SecretsManager';
import logger from '../classes/Logger';
import { AppError, HttpCode } from '../classes/AppError';

const DOCX_MIME_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const GOOGLE_DOC_MIME_TYPE = "application/vnd.google-apps.document";
const PDF_MIME_TYPE = "application/pdf";

export const getSercviceAccountAuth = async () => {
    await SecretsManager.getInstance().initialize()
    const googleSecrets = SecretsManager.getInstance().getGoogleDriveSecrets();

    return new JWT({
        email: googleSecrets.SERVICE_ACCOUNT_EMAIL,
        key: googleSecrets.PRIVATE_KEY,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            "https://www.googleapis.com/auth/drive.readonly",
            "https://www.googleapis.com/auth/drive.file",
        ],
    });
};

export function getSpreadSheetData(sheetIndex: "familiares"): Promise<Partial<FamiliarXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "scouts"): Promise<Partial<ScoutXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "entregas"): Promise<Partial<EntregaXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "usuarios"): Promise<Partial<UsuarioXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "pagos"): Promise<Partial<PagoXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "documentos"): Promise<Partial<DocumentoPresentadoSpreadsheetRow>[]>;
export function getSpreadSheetData(sheetIndex: "docs-data"): Promise<Partial<DocumentoDefinitionSpreadsheetRow>[]>;
export function getSpreadSheetData(sheetIndex: "equipos"): Promise<Partial<EquipoXLSX>[]>;
export async function getSpreadSheetData(sheetIndex: SheetIndexType) {
    const serviceAccountAuth = await getSercviceAccountAuth();
    const spreadsheetKey = SecretsManager.getInstance().getGoogleDriveSecrets().SPREADSHEET_DATA_KEY;
    const doc = new GoogleSpreadsheet(spreadsheetKey, serviceAccountAuth);
    await doc.loadInfo();
    const rows = await doc.sheetsByTitle[sheetIndex].getRows()
    const data = rows.map(docData => docData.toObject()!)
    return data
}

export async function writeSpreadSheet<T extends SheetIndexType>(sheetIndex: T, data: SpreadsheetDataMap[T]) {
    const spreadsheetKey = SecretsManager.getInstance().getGoogleDriveSecrets().SPREADSHEET_DATA_KEY;
    const serviceAccountAuth = await getSercviceAccountAuth();
    const doc = new GoogleSpreadsheet(spreadsheetKey, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[sheetIndex]
    await sheet.clearRows()
    const result = await sheet.addRows(data);
    return result
}


const transformStreamToBuffer = async (stream: Stream): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        let dataBuffer: Buffer[] = [];
        stream.on("data", (chunk) => dataBuffer.push(chunk));
        stream.on('error', function (error) {
            reject(error);
        })
        stream.on("end", async () => {
            resolve(Buffer.concat(dataBuffer as readonly Uint8Array[]));
        });
    })
}

export async function getFile(fileId: string): Promise<Buffer | undefined> {

    try {
        const serviceAccountAuth = await getSercviceAccountAuth();
        const drive = google.drive({ version: "v3", auth: serviceAccountAuth });
        const response = await drive.files.get(
            {
                fileId,
                alt: "media"
            },
            { responseType: "stream" }
        );

        const bufferData = await transformStreamToBuffer(response.data)

        return bufferData
    } catch (error) {
        console.error(error);
    }
}

async function getOrCreateBackupSheet(doc: GoogleSpreadsheet, title: string) {
    return doc.sheetsByTitle[title] ?? await doc.addSheet({ title });
}

export async function writeBackupSheet(sheetTitle: string, data: Record<string, string>[]) {
    const secrets = SecretsManager.getInstance().getGoogleDriveSecrets();
    if (!secrets.SPREADSHEET_BACKUP_KEY) {
        throw new AppError({ name: 'BACKUP_CONFIG_ERROR', description: 'SPREADSHEET_BACKUP_KEY no configurado en Infisical', httpCode: HttpCode.INTERNAL_SERVER_ERROR });
    }
    const serviceAccountAuth = await getSercviceAccountAuth();
    const doc = new GoogleSpreadsheet(secrets.SPREADSHEET_BACKUP_KEY, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = await getOrCreateBackupSheet(doc, sheetTitle);
    await sheet.clearRows();
    if (data.length > 0) {
        await sheet.setHeaderRow(Object.keys(data[0]));
        await sheet.addRows(data);
    }
}

export async function readBackupSheet(sheetTitle: string): Promise<Record<string, string>[]> {
    const secrets = SecretsManager.getInstance().getGoogleDriveSecrets();
    if (!secrets.SPREADSHEET_BACKUP_KEY) {
        throw new AppError({ name: 'BACKUP_CONFIG_ERROR', description: 'SPREADSHEET_BACKUP_KEY no configurado en Infisical', httpCode: HttpCode.INTERNAL_SERVER_ERROR });
    }
    const serviceAccountAuth = await getSercviceAccountAuth();
    const doc = new GoogleSpreadsheet(secrets.SPREADSHEET_BACKUP_KEY, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (!sheet) return [];
    const rows = await sheet.getRows();
    return rows.map(r => r.toObject() as Record<string, string>);
}

export async function exportDocxBufferAsPdf(docxBuffer: Buffer, fileName: string): Promise<Buffer> {
    const serviceAccountAuth = await getSercviceAccountAuth();
    const drive = google.drive({ version: "v3", auth: serviceAccountAuth });
    let tempGoogleDocId: string | undefined;

    try {
        const createResponse = await drive.files.create({
            requestBody: {
                name: fileName.replace(/\.docx$/i, ""),
                mimeType: GOOGLE_DOC_MIME_TYPE,
            },
            media: {
                mimeType: DOCX_MIME_TYPE,
                body: Readable.from(docxBuffer),
            },
            fields: "id",
        });

        tempGoogleDocId = createResponse.data.id || undefined;

        if (!tempGoogleDocId) {
            throw new AppError({
                name: "DOCX_TO_PDF_EXPORT_FAILED",
                description: "No se pudo convertir la nómina a PDF",
                httpCode: HttpCode.INTERNAL_SERVER_ERROR,
            });
        }

        const exportResponse = await drive.files.export(
            {
                fileId: tempGoogleDocId,
                mimeType: PDF_MIME_TYPE,
            },
            { responseType: "stream" },
        );

        return await transformStreamToBuffer(exportResponse.data);
    } catch (error) {
        logger.error(`[GoogleDriveApi] Error exportando DOCX a PDF: ${error instanceof Error ? error.message : String(error)}`);

        if (error instanceof AppError) throw error;

        throw new AppError({
            name: "DOCX_TO_PDF_EXPORT_FAILED",
            description: "No se pudo convertir la nómina a PDF",
            httpCode: HttpCode.INTERNAL_SERVER_ERROR,
        });
    } finally {
        if (tempGoogleDocId) {
            try {
                await drive.files.delete({ fileId: tempGoogleDocId });
            } catch (cleanupError) {
                logger.warn(`[GoogleDriveApi] No se pudo borrar el documento temporal ${tempGoogleDocId}: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
            }
        }
    }
}
