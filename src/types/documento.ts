export interface IDocumento {
    scoutId: string;
    documentoId: string;
    fechaPresentacion: Date;
}

export interface IDocumentoData {
    id: string;
    scout: {
        nombre: string;
        apellido: string;
    };
    documento: {
        nombre: string;
        vence: boolean;
    };
    scoutId: string;
    fechaPresentacion: Date;
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
