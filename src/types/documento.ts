export interface IDocumento {
    scoutId?: string | null;
    documentoId: string;
    fechaPresentacion?: Date;
    uploadId?: string
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
    "Id carga de archivo"?: string
}
