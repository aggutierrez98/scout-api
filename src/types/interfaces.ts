import { ProgresionEnum, TipoInsigniaEnum } from "./XLSXTypes";
import {
	FuncionType,
	ProgresionType,
	ReligionType,
	SexoType,
} from "./constantTypes";

export interface IFamiliarScout {
	id: number;
	familiarId: number;
	scoutId: number;
}

export interface IDocPresentado {
	id: number;
	documentoId: number;
	scoutId: number;
	fechaPresentacion: Date;
}

export interface IInsignaObt {
	id: number;
	scoutId: number;
	insignia: TipoInsigniaEnum;
	progresion: ProgresionEnum;
	fechaObtencion: Date;
}

export interface IScout {
	nombre: string;
	apellido: string;
	fechaNacimiento: Date;
	dni: string;
	sexo: SexoType;
	localidad: string;
	direccion: string;
	telefono: string | null;
	mail: string | null;
	patrullaId: number | null;
	religion: ReligionType | null;
	progresionActual: ProgresionType | null;
	Funcion: FuncionType | null;
}

export interface IScoutData extends IScout {
	id: number;
	documentosPresentados?: IDocPresentado[];
	familiarScout?: IFamiliarScout[];
	insigniasObtenidas?: IInsignaObt[];
	fechaActualizacion: Date;
	fechaCreacion: Date;
}
