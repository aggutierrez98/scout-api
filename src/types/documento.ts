// import { UploadedFile } from "express-fileupload";

export interface IDocumento {
    scoutId?: string | null;
    documentoId: string;
    fechaPresentacion?: Date;
    uploadId?: string
    fileUrl?: string
    requiereFirma?: boolean
    requiereFamiliar?: boolean
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
    vence: boolean;
    completable: boolean;
    fileUploadId: string | null
    requiereFirma: boolean
    requiereFamiliar: boolean
}

export type DocumentoXLSX = {
    Fecha: string
    Scout: string
    Documento: string
}

export type DocDataXLSX = {
    Nombre: string
    Vence: "Si" | "No"
    Completable: "Si" | "No"
    "Requiere firma"?: "Si" | "No"
    "Requiere familiar"?: "Si" | "No"
    "Id carga de archivo"?: string
}
