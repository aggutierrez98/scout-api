import { z } from "zod";
import {
	VALID_GET_SCOUTS_FILTERS,
	VALID_SEX,
	VALID_PROGRESSIONS,
	VALID_RELIGIONS,
	VALID_FUNCTIONS,
} from "../utils";
import { PrismaClient } from "@prisma/client";
import { IScout } from "../types";

export const errorMap: z.ZodErrorMap = (error, ctx) => {
	if (error.message) return { message: error.message };

	switch (error.code) {
		case z.ZodIssueCode.invalid_type:
			if (error.expected === "string") {
				return { message: "Debe ser un texto valido" };
			}
			if (error.expected === "number") {
				return { message: "Debe ser un numero valido" };
			}
			break;

		case z.ZodIssueCode.custom: {
			if (ctx.defaultError === "Invalid input") {
				if (error.path.length === 2) {
					return {
						message: `El Parametro ${error.path[1]} '${ctx.data}' no esta ingresado en los datos`,
					};
				}
			}
			break;
		}

		case z.ZodIssueCode.invalid_enum_value: {
			return {
				message: `Valor enviado es invalido. Valores validos: [${error.options}]`,
			};
		}

		case z.ZodIssueCode.invalid_string: {
			return {
				message: `El valor enviado '${ctx.data}' no tiene el formato valido.`,
			};
		}
	}

	return { message: ctx.defaultError };
};

const numberReg = /^[0-9]/;
const lettersReg = /^[a-zA-Z]/;
const directionReg = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const validScoutID = async (id: string) => {
	const prisma = new PrismaClient();
	const ScoutModel = prisma.scout;
	const respItem = await ScoutModel.findUnique({ where: { id: Number(id) } });
	return !!respItem;
};

const ScoutSchema = z.object({
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
	Funcion: z.enum(VALID_FUNCTIONS),
	progresionActual: z.enum(VALID_PROGRESSIONS),
}) satisfies z.Schema<IScout>;

const IdSchema = z.string().regex(numberReg).refine(validScoutID);

const QuerySearchSchema = z.object({
	offset: z.string().regex(numberReg).optional(),
	limit: z.string().regex(numberReg).optional(),
	orderBy: z.enum(VALID_GET_SCOUTS_FILTERS).optional(),
});

export const GetScoutsSchema = z.object({
	query: QuerySearchSchema,
});

export const GetScoutSchema = z.object({
	params: z.object({
		id: IdSchema,
	}),
});

export const PostScoutSchema = z.object({
	body: ScoutSchema,
});

export const PutScoutSchema = z.object({
	params: z.object({
		id: IdSchema,
	}),
	body: ScoutSchema.deepPartial(),
});

export const DeleteScoutSchema = z.object({
	params: z.object({
		id: IdSchema,
	}),
});
