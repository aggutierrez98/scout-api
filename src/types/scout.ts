export interface IScout {
    nombre: string;
    apellido: string;
    fechaNacimiento: Date;
    dni: string;
    sexo: string;
    localidad: string;
    direccion: string;
    telefono: string | null;
    mail: string | null;
    equipoId: string | null;
    rama: string | null;
    nacionalidad: string | null;
    provincia: string | null;
    religion: string | null;
    progresionActual: string | null;
    funcion: string | null;
}

export interface IScoutData extends IScout {
    id: string;
    documentosPresentados?: {
        id: string;
        nombre: string;
        vence: boolean;
        fechaPresentacion: Date;
    }[];
    entregasObtenidas?: {
        id: string;
        tipoEntrega: string;
        fechaEntrega: Date;
    }[];
    familiares?: {
        nombre: string;
        apellido: string;
        sexo: string;
        dni: string;
        fechaNacimiento: Date;
        localidad: string;
        direccion: string
        mail?: string | null
        telefono?: string | null;
        estadoCivil?: string | null
    }[];
    equipo?: {
        id: string;
        nombre: string;
        lema: string | null;
    } | null;
    fechaActualizacion: Date;
    fechaCreacion: Date;
}

export type ScoutXLSX = {
    Documento: string;
    Nombre: string;
    Sexo: string;
    "Fecha Nacimiento": string;
    Provincia: string;
    Nacionalidad: string;
    Localidad: string;
    Calle: string;
    "Codigo Postal": string;
    Telefono: string;
    Email: string;
    Religion: string;
    Funcion: string;
    Categoria: string;
    Rama: string;
    "Fecha Primer Afiliacion": string;
    Equipo: string;
    Estado: string;
    Progresion: string;
    Padre: string
    Madre: string
    Tio: string
    Tia: string
    Hermano: string
    Hermana: string
    Abuelo: string
    Abuela: string
    Otro: string
};
