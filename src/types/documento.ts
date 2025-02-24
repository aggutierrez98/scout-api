export interface IDocumento {
    scoutId?: string | null;
    documentoId: string;
    fechaPresentacion?: Date;
    uploadId?: string
}

export interface IDocumentoData {
    id: string;
    scout: {
        nombre: string;
        apellido: string;
    } | null;
    documento: {
        nombre: string;
        vence: boolean;
    };
    fechaPresentacion: Date;
    scoutId: string | null;
    uploadId: string | null
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
}
