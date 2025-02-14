import { IScout } from "./scout";

export interface IEquipo {
    nombre: string;
    rama: string | null;
    lema?: string | null;
    scouts?: IScout[];
}

export interface IEquipoData extends IEquipo {
    id: string;
    fechaCreacion: Date;
    rama: string | null;
    fechaActualizacion: Date;
}

export type EquipoXLSX = {
    Nombre: string
    Lema: string
    Rama: string
}
