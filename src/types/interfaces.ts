import { ProgresionEnum, TipoInsigniaEnum } from "./XLSXTypes";
import {
	FuncionType,
	ProgresionType,
	RelacionFamiliarType,
	ReligionType,
	SexoType,
	TipoInsigniaType,
} from "./constantTypes";

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
	funcion: FuncionType | null;
}

export interface IScoutData extends IScout {
	id: number;
	documentosPresentados?: {
		id: number;
		documento: {
			nombre: string;
			vence: boolean;
		};
		fechaPresentacion: Date;
	}[];
	insigniasObtenidas?: {
		id: number;
		insignia: TipoInsigniaType;
		progresion: ProgresionType | null;
		fechaObtencion: Date;
	}[];
	familiarScout?: {
		relacion: RelacionFamiliarType;
		familiar: {
			id: number;
			nombre: string;
			apellido: string;
			dni: string;
			telefono: string;
			sexo: SexoType;
			fechaNacimiento: Date;
		};
	}[];
	fechaActualizacion: Date;
	fechaCreacion: Date;
}

export interface IPatrulla {
	nombre: string;
	lema?: string | null;
	scouts?: IScout[];
}

export interface IPatrullaData extends IPatrulla {
	id: number;
	fechaCreacion: Date;
	fechaActualizacion: Date;
}

export interface IFamiliarScout {
	id: number;
	familiarId: number;
	scouts: IScout[];
}

export interface IInsignaObt {
	id: number;
	scoutId: number;
	insignia: TipoInsigniaType;
	progresion: ProgresionType | null;
	fechaObtencion: Date;
}

export interface IDocumento {
	scoutId: string;
	documentoId: string;
	fechaPresentacion: Date;
}

export interface IDocumentoData {
	id: number;
	scout: {
		nombre: string;
		apellido: string;
	};
	documento: {
		nombre: string;
		vence: boolean;
	};
	scoutId: number;
	fechaPresentacion: Date;
}