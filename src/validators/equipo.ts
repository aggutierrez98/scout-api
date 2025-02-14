import { z } from "zod";
import { IEquipo } from "../types";
import { ScoutSchema } from "./scout";
import { IdSchema } from "./generics";
import { VALID_RAMAS } from "../utils";
import { prismaClient } from "../utils/lib/prisma-client";

const validEquipoId = async (id: string) => {
	const ParullaModel = prismaClient.equipo;
	const respItem = await ParullaModel.findUnique({ where: { uuid: id } });
	return !!respItem;
};

export const EquipoSchema = z.object({
	nombre: z.string().max(45),
	lema: z.string().max(100).nullable(),
	fechaCreacion: z.date(),
	rama: z.enum(VALID_RAMAS),
	Scouts: z.array(ScoutSchema).optional(),

}) satisfies z.Schema<IEquipo>;

export const GetEquiposSchema = z.object({});

export const GetEquipoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validEquipoId),
	}),
});

export const PostEquipoSchema = z.object({
	body: EquipoSchema,
});

export const PutEquipoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validEquipoId),
	}),
	body: EquipoSchema.deepPartial(),
});

export const DeleteEquipoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validEquipoId),
	}),
});
