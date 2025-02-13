import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
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

export function getSpreadSheetData(sheetIndex: "familiares"): Promise<Partial<FamiliarXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "scouts"): Promise<Partial<ScoutXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "entregas"): Promise<Partial<EntregaXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "usuarios"): Promise<Partial<UsuarioXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "pagos"): Promise<Partial<PagoXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "documentos"): Promise<Partial<DocumentoXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "docs-data"): Promise<Partial<DocDataXLSX>[]>;
export function getSpreadSheetData(sheetIndex: "equipos"): Promise<Partial<EquipoXLSX>[]>;
export async function getSpreadSheetData(sheetIndex: SheetIndexType) {
    const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
        ],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_DATA_KEY!, serviceAccountAuth);
    await doc.loadInfo();
    const rows = await doc.sheetsByTitle[sheetIndex].getRows()
    const data = rows.map(docData => docData.toObject()!)
    return data
}

export async function writeSpreadSheet<T extends SheetIndexType>(sheetIndex: T, data: SpreadsheetDataMap[T]) {

    const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
        ],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_DATA_KEY!, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[sheetIndex]
    await sheet.clearRows()
    const result = await sheet.addRows(data);
    return result
}