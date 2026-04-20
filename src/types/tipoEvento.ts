export interface ITipoEvento {
	nombre: string;
	documentosEventoIds: string[];
	documentosParticipante: Array<{
		documentoId: string;
		tipoParticipante: string;
	}>;
}

export interface ITipoEventoData {
	id: string;
	nombre: string;
	activo: boolean;
	fechaCreacion: Date;
	fechaActualizacion: Date;
	documentosEvento?: Array<{ id: string; nombre: string }>;
	documentosParticipante?: Array<{
		documentoId: string;
		tipoParticipante: string;
		documento: { id: string; nombre: string };
	}>;
}
