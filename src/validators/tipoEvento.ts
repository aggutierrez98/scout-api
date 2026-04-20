import { z } from "zod";
import { prismaClient } from "../utils/lib/prisma-client";
import { IdSchema, QuerySearchSchema } from "./generics";
import { VALID_TIPOS_PARTICIPANTE } from "../utils";

const validTipoEventoId = async (id: string) => {
	const item = await prismaClient.tipoEvento.findUnique({ where: { uuid: id } });
	return !!item;
};

const validDocumentoId = async (id: string) => {
	const item = await prismaClient.documento.findUnique({ where: { uuid: id } });
	return !!item;
};

const DocumentoEventoSchema = z.string().refine(validDocumentoId, "Documento no encontrado");

const DocumentoParticipanteSchema = z.object({
	documentoId: z.string().refine(validDocumentoId, "Documento no encontrado"),
	tipoParticipante: z.enum(VALID_TIPOS_PARTICIPANTE),
});

export const TipoEventoBodySchema = z.object({
	nombre: z.string().min(1).max(100),
	documentosEventoIds: z.array(DocumentoEventoSchema).default([]),
	documentosParticipante: z.array(DocumentoParticipanteSchema).default([]),
});

export const GetTiposEventoSchema = z.object({
	query: QuerySearchSchema,
});

export const GetTipoEventoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validTipoEventoId, "TipoEvento no encontrado"),
	}),
});

export const PostTipoEventoSchema = z.object({
	body: TipoEventoBodySchema,
});

export const PutTipoEventoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validTipoEventoId, "TipoEvento no encontrado"),
	}),
	body: TipoEventoBodySchema.partial(),
});

export const DeleteTipoEventoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validTipoEventoId, "TipoEvento no encontrado"),
	}),
});
