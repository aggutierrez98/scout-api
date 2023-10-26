import { Decimal } from "@prisma/client/runtime/library";
import {
	FuncionType,
	MetodosPagoType,
	ProgresionType,
	RelacionFamiliarType,
	ReligionType,
	RolesType,
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
	patrullaId: string | null;
	religion: ReligionType | null;
	progresionActual: ProgresionType | null;
	funcion: FuncionType | null;
}

export interface IScoutData extends IScout {
	id: string;
	documentosPresentados?: {
		id: string;
		nombre: string;
		vence: boolean;
		fechaPresentacion: Date;
	}[];
	insigniasObtenidas?: {
		id: string;
		insignia: TipoInsigniaType;
		progresion: ProgresionType | null;
		fechaObtencion: Date;
	}[];
	familiares?: {
		relacion: RelacionFamiliarType;
		id: string;
		nombre: string;
		apellido: string;
		dni: string;
		telefono: string;
		sexo: SexoType;
		fechaNacimiento: Date;
	}[];
	patrulla?: {
		id: string;
		nombre: string;
		lema: string | null;
	} | null;
	fechaActualizacion: Date;
	fechaCreacion: Date;
}

export interface IPatrulla {
	nombre: string;
	lema?: string | null;
	scouts?: IScout[];
}

export interface IPatrullaData extends IPatrulla {
	id: string;
	fechaCreacion: Date;
	fechaActualizacion: Date;
}

export interface IFamiliarScout {
	id: string;
	familiarId: string;
	scouts: IScout[];
}

export interface IInsignaObt {
	id: string;
	scoutId: string;
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

export interface IPago {
	scoutId: string;
	concepto: string;
	monto: number | Decimal;
	metodoPago: MetodosPagoType;
	fechaPago: Date;
}

export interface IPagoData extends IPago {
	id: string;
	rendido: boolean;
	fechaCreacion: Date;
	uuid: undefined;
}

export interface IFamiliar {
	nombre: string;
	apellido: string;
	fechaNacimiento: Date;
	dni: string;
	sexo: SexoType;
	telefono: string;
}

export interface IFamiliarScoutData extends IFamiliar {
	id: string;
	scoutFamiliares?: {
		id: number;
		nombre: string;
		apellido: string;
		dni: string;
		fechaNacimiento: Date;
		sexo: SexoType;
	}[];
}

export interface IUser {
	username: string,
	password?: string
}
export interface IUserData {
	id: string;
	username: string,
	token: unknown,
	scout: IScoutData
	role: RolesType
}