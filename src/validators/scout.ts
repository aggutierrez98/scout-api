import { z } from "zod";
import {
	VALID_SEX,
	VALID_PROGRESSIONS,
	VALID_RELIGIONS,
	VALID_FUNCTIONS,
	VALID_GET_SCOUTS_FILTERS,
	VALID_RAMAS,
} from "../utils";
import { IScout } from "../types";
import { directionReg, lettersReg, numberReg } from "../utils/regex";
import { IdSchema, QuerySearchSchema } from "./generics";
import { prismaClient } from "../utils/lib/prisma-client";

export const validScoutID = async (id: string) => {
	const ScoutModel = prismaClient.scout;
	const respItem = await ScoutModel.findUnique({ where: { uuid: id } });
	return !!respItem;
};

export const ScoutSchema = z.object({
	nombre: z.string().max(100).regex(lettersReg),
	apellido: z.string().max(100).regex(lettersReg),
	fechaNacimiento: z.date(),
	dni: z.string().max(10).regex(numberReg),
	sexo: z.enum(VALID_SEX),
	localidad: z.string().max(100).regex(lettersReg),
	direccion: z.string().max(100).regex(directionReg),
	telefono: z.string().max(15).regex(numberReg).nullable(),
	mail: z.string().min(1).email().nullable(),
	religion: z.enum(VALID_RELIGIONS),
	equipoId: IdSchema.max(10).nullable(),
	funcion: z.enum(VALID_FUNCTIONS),
	rama: z.enum(VALID_RAMAS),
	progresionActual: z.enum(VALID_PROGRESSIONS).nullable(),
}) satisfies z.Schema<IScout>;

export const GetScoutsSchema = z.object({
	query: QuerySearchSchema.extend({
		orderBy: z.enum(VALID_GET_SCOUTS_FILTERS).optional(),
	}),
});

export const GetScoutSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validScoutID),
	}),
});

export const PostScoutSchema = z.object({
	body: ScoutSchema,
});

export const PutScoutSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validScoutID),
	}),
	body: ScoutSchema.deepPartial(),
});

export const DeleteScoutSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validScoutID),
	}),
});
