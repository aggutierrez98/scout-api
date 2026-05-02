import { TipoAvisoType, ReferenciaTipoType } from "./constantTypes";

export interface IAviso {
	titulo: string;
	mensaje: string;
	tipo: TipoAvisoType;
	referenciaId?: string;
	referenciaTipo?: ReferenciaTipoType;
	userIds: string[];
}

export interface IAvisoData {
	id: string;
	titulo: string;
	mensaje: string;
	tipo: string;
	referenciaId?: string | null;
	referenciaTipo?: string | null;
	fechaCreacion: Date;
}

export interface INotificacionData {
	id: string;
	aviso: IAvisoData;
	leida: boolean;
	fechaCreacion: Date;
	fechaLectura: Date | null;
}

export interface INotificacionesResponse {
	notificaciones: INotificacionData[];
	totalNoLeidas: number;
	total: number;
}
