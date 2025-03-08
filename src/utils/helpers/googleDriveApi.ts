import { GoogleSpreadsheet } from 'google-spreadsheet';
import { auth, JWT } from 'google-auth-library';
import {
    DocDataXLSX,
    DocumentoXLSX,
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
import { Stream } from 'stream';

const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY,
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        "https://www.googleapis.com/auth/drive.readonly"
    ],
});

export function getSpreadSheetData(sheetIndex: "familiares"): Promise<Partial<FamiliarXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "scouts"): Promise<Partial<ScoutXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "entregas"): Promise<Partial<EntregaXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "usuarios"): Promise<Partial<UsuarioXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "pagos"): Promise<Partial<PagoXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "documentos"): Promise<Partial<DocumentoXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "docs-data"): Promise<Partial<DocDataXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "equipos"): Promise<Partial<EquipoXLSX>[]>;
export async function getSpreadSheetData(sheetIndex: SheetIndexType) {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_DATA_KEY!, serviceAccountAuth);
    await doc.loadInfo();
    const rows = await doc.sheetsByTitle[sheetIndex].getRows()
    const data = rows.map(docData => docData.toObject()!)
    return data
}

export async function writeSpreadSheet<T extends SheetIndexType>(sheetIndex: T, data: SpreadsheetDataMap[T]) {
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_DATA_KEY!, serviceAccountAuth);
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
            resolve(Buffer.concat(dataBuffer));
        });
    })
}

export async function getPDFFile(fileId: string): Promise<Buffer | undefined> {

    try {
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