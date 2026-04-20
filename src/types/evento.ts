import type { RamasType } from "./constantTypes";

export interface IEvento {
	nombre: string;
	descripcion: string;
	tipoEventoId: string;
	lugarNombre?: string | null;
	lugarDireccion: string;
	lugarLocalidad: string;
	lugarPartido: string;
	lugarProvincia: string;
	lugarLatitud?: number | null;
	lugarLongitud?: number | null;
	fechaHoraInicio: Date;
	fechaHoraFin: Date;
	costo?: number | null;
}

export interface IAddParticipantes {
	scoutId?: string;
	equipoId?: string;
	rama?: RamasType;
	tipoParticipante: string;
}

export interface IEventoData {
	id: string;
	nombre: string;
	descripcion: string;
	tipoEventoId: string;
	tipoEvento?: { id: string; nombre: string };
	lugarNombre?: string | null;
	lugarDireccion: string;
	lugarLocalidad: string;
	lugarPartido: string;
	lugarProvincia: string;
	lugarLatitud?: number | null;
	lugarLongitud?: number | null;
	fechaHoraInicio: Date;
	fechaHoraFin: Date;
	costo?: number | null;
	activo: boolean;
	fechaCreacion: Date;
	fechaActualizacion: Date;
	participantes?: Array<{
		id: string;
		scoutId: string;
		tipoParticipante: string;
		scout?: { id: string; nombre: string; apellido: string };
	}>;
}
