// import { UploadedFile } from "express-fileupload";

export interface IDocumento {
    scoutId?: string | null;
    documentoId: string;
    fechaPresentacion?: Date;
    uploadId?: string
    fileUrl?: string
}

export interface IDocumentoEntregado {
    id: string;
    scout: {
        nombre: string;
        apellido: string;
    } | null;
    documento: Omit<IDocumentoData, "id">;
    fechaPresentacion: Date;
    scoutId: string | null;
}

export interface IDocumentoData {
    id: string;
    nombre: string;
    requiereRenovacionAnual: boolean;
    requeridoParaIngreso: boolean;
    completableDinamicamente: boolean;
    googleDriveFileId: string | null
    requiereFirmaFamiliar: boolean
    requiereDatosFamiliar: boolean
}

export type DocumentoPresentadoSpreadsheetRow = {
    Fecha: string
    Scout: string
    Documento: string
}

export type DocumentoSpreadsheetBoolean = "Si" | "No" | "";

export type DocumentoDefinitionSpreadsheetRow = {
    "Nombre del documento": string
    "Requiere renovacion anual": DocumentoSpreadsheetBoolean
    "Requerido para ingreso"?: DocumentoSpreadsheetBoolean
    "Completable dinamicamente": DocumentoSpreadsheetBoolean
    "Id carga de archivo en google drive"?: string
    "Requiere firma del familiar"?: DocumentoSpreadsheetBoolean
    "Requiere datos del familiar"?: DocumentoSpreadsheetBoolean
}

export interface DocumentoSeedDefinition {
    nombre: string;
    requiereRenovacionAnual: boolean;
    requeridoParaIngreso: boolean;
    completableDinamicamente: boolean;
    googleDriveFileId: string | null;
    requiereFirmaFamiliar: boolean;
    requiereDatosFamiliar: boolean;
}
