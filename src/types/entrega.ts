import { TipoEntregaType } from "./constantTypes";

export interface IEntrega {
    scoutId: string;
    fechaEntrega: Date | string;
    tipoEntrega: string;
}

export interface IEntregaData extends IEntrega {
    id: string;
    fechaCreacion: Date;
}


export type EntregaXLSX = {
    Fecha: string
    "Tipo de entrega": TipoEntregaType
    Scout: string
}