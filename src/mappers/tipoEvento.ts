import { TipoEvento, TipoEventoDocumento, TipoEventoDocumentoParticipante, Documento } from "@prisma/client";

type TipoEventoWithRelations = TipoEvento & {
	documentosEvento?: Array<TipoEventoDocumento & { documento: Documento }>;
	documentosParticipante?: Array<TipoEventoDocumentoParticipante & { documento: Documento }>;
};

export const mapTipoEvento = (tipoEvento: TipoEventoWithRelations) => {
	const { id: _id, uuid, documentosEvento, documentosParticipante, ...rest } = tipoEvento;
	return {
		...rest,
		id: uuid,
		documentosEvento: documentosEvento?.map(({ documento, tipoEventoId: _t, documentoId: _d, id: _id }) => ({
			id: documento.uuid,
			nombre: documento.nombre,
		})),
		documentosParticipante: documentosParticipante?.map(({ documento, tipoEventoId: _t, documentoId: _d, id: _id, tipoParticipante }) => ({
			tipoParticipante,
			documentoId: documento.uuid,
			documento: { id: documento.uuid, nombre: documento.nombre },
		})),
	};
};
