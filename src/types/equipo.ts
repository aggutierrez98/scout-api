import { IScout } from "./scout";

export interface IEquipo {
    nombre: string;
    lema?: string | null;
    scouts?: IScout[];
}

export interface IEquipoData extends IEquipo {
    id: string;
    fechaCreacion: Date;
    fechaActualizacion: Date;
}

export type EquipoXLSX = {
    Nombre: string
    Lema: string
}
