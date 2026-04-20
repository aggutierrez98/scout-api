import { z } from "zod";
import { IdSchema, QuerySearchSchema } from "./generics";
import { VALID_TIPOS_AVISO, VALID_REFERENCIA_TIPOS } from "../utils";
import { prismaClient } from "../utils/lib/prisma-client";

const validNotificacionId = async (id: string) => {
	const respItem = await prismaClient.notificacion.findUnique({ where: { uuid: id } });
	return !!respItem;
};

const validUserId = async (id: string) => {
	const respItem = await prismaClient.user.findUnique({ where: { uuid: id } });
	return !!respItem;
};

export const AvisoSchema = z.object({
	titulo: z.string().min(1).max(100),
	mensaje: z.string().min(1).max(500),
	tipo: z.enum(VALID_TIPOS_AVISO),
	referenciaId: IdSchema.optional(),
	referenciaTipo: z.enum(VALID_REFERENCIA_TIPOS).optional(),
	userIds: z.array(IdSchema.refine(validUserId)).min(1),
});

export const GetNotificacionesSchema = z.object({
	query: QuerySearchSchema.extend({
		leida: z.enum(["true", "false"]).optional(),
	}),
});

export const PostAvisoSchema = z.object({
	body: AvisoSchema,
});

export const PutNotificacionSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validNotificacionId),
	}),
});

const validAvisoId = async (id: string) => {
	const respItem = await prismaClient.aviso.findUnique({ where: { uuid: id } });
	return !!respItem;
};

export const GetAvisosSchema = z.object({
	query: z.object({
		limit: z.string().optional(),
		offset: z.string().optional(),
		tipo: z.enum(VALID_TIPOS_AVISO).optional(),
		fechaDesde: z.string().datetime({ offset: true }).optional(),
		fechaHasta: z.string().datetime({ offset: true }).optional(),
		userId: IdSchema.optional(),
	}),
});

export const GetAvisoDestinatariosSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validAvisoId),
	}),
});
