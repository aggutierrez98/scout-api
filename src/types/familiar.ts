import { IScout } from "./scout";

export interface IFamiliarScout {
    id: string;
    familiarId: string;
    scouts: IScout[];
}

export interface IFamiliar {
    nombre: string;
    apellido: string;
    sexo: string;
    dni: string;
    fechaNacimiento: Date;
    localidad: string;
    direccion: string
    nacionalidad: string | null;
    provincia: string | null;
    mail?: string | null
    telefono?: string | null;
    estadoCivil?: string | null
}

export interface IFamiliarScoutData extends IFamiliar {
    id: string;
    scoutFamiliares?: {
        id: string;
        nombre: string;
        apellido: string;
        edad: number;
        fechaNacimiento: Date;
        sexo: string;
    }[];
}

export type FamiliarXLSX = {
    Documento: string;
    Nombre: string;
    Sexo: string;
    "Fecha Nacimiento": string;
    Provincia: string;
    Localidad: string;
    Nacionalidad: string;
    Email: string;
    Calle: string;
    "Codigo Postal": string;
    Telefono: string;
    "Estado Civil": "SOLTERO" | "CASADO" | "SEPARADO";
};
