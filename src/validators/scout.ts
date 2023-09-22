import { z } from "zod";
import {
	VALID_SEX,
	VALID_PROGRESSIONS,
	VALID_RELIGIONS,
	VALID_FUNCTIONS,
	VALID_GET_SCOUTS_FILTERS,
} from "../utils";
import { PrismaClient } from "@prisma/client";
import { IScout } from "../types";
import { IdSchema, QuerySearchSchema } from "./http";
import { directionReg, lettersReg, numberReg } from "./regex";

export const validScoutID = async (id: string) => {
	const prisma = new PrismaClient();
	const ScoutModel = prisma.scout;
	const respItem = await ScoutModel.findUnique({ where: { id: Number(id) } });
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
	telefono: z.string().max(15).regex(numberReg),
	mail: z.string().min(1).email(),
	progresion: z.enum(VALID_PROGRESSIONS),
	religion: z.enum(VALID_RELIGIONS),
	patrullaId: z.number().max(10),
	funcion: z.enum(VALID_FUNCTIONS),
	progresionActual: z.enum(VALID_PROGRESSIONS),
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
