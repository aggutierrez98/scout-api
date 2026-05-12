import { MetodosPagoType, TipoPagoType } from "./constantTypes";

export type TipoPago = TipoPagoType;

export interface IPago {
    scoutId: string;
    concepto: string;
    monto: number;
    metodoPago: string;
    fechaPago: Date | string;
    tipoPago?: TipoPago;
    mesCuota?: number | null;
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
