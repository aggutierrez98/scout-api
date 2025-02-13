import { Decimal } from "@prisma/client/runtime/library";
import {
	EstadoCivilType,
	FuncionType,
	MetodosPagoType,
	ProgresionType,
	ReligionType,
	RolesType,
	SexoType,
	TipoEntregaType,
} from "./constantTypes";

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
	patrullaId: string | null;
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
	tipoEntrega: string;
	progresion: string | null;
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
	monto: number;
	metodoPago: string;
	fechaPago: Date | string;
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
	sexo: string;
	dni: string;
	fechaNacimiento: Date;
	localidad: string;
	direccion: string
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

export interface IUser {
	username: string,
	password?: string
}
export interface IUserData {
	id: string;
	username: string,
	token: unknown,
	scout: IScoutData | null
	role: string
}

export interface IEntrega {
	scoutId: string;
	fechaEntrega: Date | string;
	tipoEntrega: string;
}

export interface IEntregaData extends IEntrega {
	id: string;
	uuid: undefined;
	fechaCreacion: Date;
}
