import { MetodosPagoType } from "./constantTypes";


export interface IPago {
    scoutId: string;
    concepto: string;
    monto: number;
    metodoPago: string;
    fechaPago: Date | string;
}

export interface IReciboPagoData {
    numeroRecibo: number;
    uploadPath: string | null;
    fileUrl: string | null;
    fechaCreacion: Date;
}

export interface IPagoData extends IPago {
    id: string;
    rendido: boolean;
    fechaCreacion: Date;
    reciboPago?: IReciboPagoData | null;
}

export type PagoXLSX = {
    Concepto: string
    Fecha: string
    Monto: string
    "Metodo de pago": MetodosPagoType
    Rendido: string,
    Scout: string
}
