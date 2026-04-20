import { z } from "zod";
import { prismaClient } from "../utils/lib/prisma-client";
import { IdSchema, QuerySearchSchema } from "./generics";
import { VALID_TIPOS_PARTICIPANTE, VALID_RAMAS } from "../utils";
import { ISODateStringReg } from "../utils/regex";

const validEventoId = async (id: string) => {
	const item = await prismaClient.evento.findUnique({ where: { uuid: id } });
	return !!item;
};

const validTipoEventoId = async (id: string) => {
	const item = await prismaClient.tipoEvento.findUnique({ where: { uuid: id } });
	return !!item;
};

const validScoutId = async (id: string) => {
	const item = await prismaClient.scout.findUnique({ where: { uuid: id } });
	return !!item;
};

const validEquipoId = async (id: string) => {
	const item = await prismaClient.equipo.findUnique({ where: { uuid: id } });
	return !!item;
};

const validParticipanteId = async (id: string) => {
	const item = await prismaClient.eventoParticipante.findUnique({ where: { uuid: id } });
	return !!item;
};

export const EventoBodySchema = z.object({
	nombre: z.string().min(1).max(200),
	descripcion: z.string().min(1),
	tipoEventoId: IdSchema.refine(validTipoEventoId, "TipoEvento no encontrado"),
	lugarNombre: z.string().max(200).optional().nullable(),
	lugarDireccion: z.string().min(1).max(300),
	lugarLocalidad: z.string().min(1).max(100),
	lugarPartido: z.string().min(1).max(100),
	lugarProvincia: z.string().min(1).max(100),
	lugarLatitud: z.number().optional().nullable(),
	lugarLongitud: z.number().optional().nullable(),
	fechaHoraInicio: z.string().pipe(z.coerce.date()),
	fechaHoraFin: z.string().pipe(z.coerce.date()),
	costo: z.number().nonnegative().optional().nullable(),
});

export const GetEventosSchema = z.object({
	query: QuerySearchSchema.extend({
		nombre: z.string().max(200).optional(),
		fechaDesde: z.string().regex(ISODateStringReg).optional(),
		fechaHasta: z.string().regex(ISODateStringReg).optional(),
	}),
});

export const GetEventoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validEventoId, "Evento no encontrado"),
	}),
});

export const PostEventoSchema = z.object({
	body: EventoBodySchema,
});

export const PutEventoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validEventoId, "Evento no encontrado"),
	}),
	body: EventoBodySchema.partial(),
});

export const DeleteEventoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validEventoId, "Evento no encontrado"),
	}),
});

export const PostParticipantesSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validEventoId, "Evento no encontrado"),
	}),
	body: z.object({
		scoutId: IdSchema.refine(validScoutId, "Scout no encontrado").optional(),
		equipoId: IdSchema.refine(validEquipoId, "Equipo no encontrado").optional(),
		rama: z.enum(VALID_RAMAS).optional(),
		tipoParticipante: z.enum(VALID_TIPOS_PARTICIPANTE),
	}).refine(
		(data) => data.scoutId || data.equipoId || data.rama,
		"Debe proveer scoutId, equipoId o rama",
	),
});

export const DeleteParticipanteSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validEventoId, "Evento no encontrado"),
		participanteId: IdSchema.refine(validParticipanteId, "Participante no encontrado"),
	}),
});
