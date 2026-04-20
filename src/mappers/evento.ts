import { Documento, Evento, EventoParticipante, Scout, TipoEvento, TipoEventoDocumento, TipoEventoDocumentoParticipante } from "@prisma/client";

type TipoEventoWithDocs = TipoEvento & {
	documentosEvento?: Array<TipoEventoDocumento & { documento: Documento }>;
	documentosParticipante?: Array<TipoEventoDocumentoParticipante & { documento: Documento }>;
};

type EventoWithRelations = Evento & {
	tipoEvento?: TipoEventoWithDocs;
	participantes?: Array<EventoParticipante & { scout?: Pick<Scout, "uuid" | "nombre" | "apellido"> }>;
};

export const mapEvento = (evento: EventoWithRelations) => {
	const { id: _id, uuid, tipoEvento, participantes, tipoEventoId, ...rest } = evento;
	return {
		...rest,
		id: uuid,
		tipoEventoId: tipoEvento?.uuid ?? tipoEventoId,
		tipoEvento: tipoEvento ? {
			id: tipoEvento.uuid,
			nombre: tipoEvento.nombre,
			documentosEvento: tipoEvento.documentosEvento?.map(({ documento }) => ({ id: documento.uuid, nombre: documento.nombre })),
			documentosParticipante: tipoEvento.documentosParticipante?.map(({ documento, tipoParticipante }) => ({
				tipoParticipante,
				documentoId: documento.uuid,
				documento: { id: documento.uuid, nombre: documento.nombre },
			})),
		} : undefined,
		participantes: participantes?.map(({ id: _pid, uuid: pUuid, eventoId: _eid, scoutId: _sid, scout, tipoParticipante, fechaCreacion }) => ({
			id: pUuid,
			scoutId: scout?.uuid ?? _sid,
			tipoParticipante,
			fechaCreacion,
			scout: scout
				? { id: scout.uuid, nombre: scout.nombre, apellido: scout.apellido }
				: undefined,
		})),
	};
};

export const mapEventoParticipante = (p: EventoParticipante) => {
	const { id: _id, uuid, eventoId: _eid, scoutId, ...rest } = p;
	return { ...rest, id: uuid, scoutId };
};
