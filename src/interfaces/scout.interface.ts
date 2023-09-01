import { IDocPresentado } from "./documentoPresentado.interface";
import { IInsignaObt } from "./insigniaObtenida.interface";
import { IFamiliarScout } from "./familiarScout.interface";
import { ProgresionType, FuncionType, ReligionType, SexoType } from "./types";

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
