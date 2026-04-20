import { z } from "zod";
import {
	VALID_SEX,
	VALID_PROGRESSIONS,
	VALID_RELIGIONS,
	VALID_FUNCTIONS,
	VALID_GET_SCOUTS_FILTERS,
	VALID_RAMAS,
	PROGRESIONES_POR_RAMA,
} from "../utils";
import type { IScout } from "../types";
import { directionReg, lettersReg, numberReg } from "../utils/regex";
import { IdSchema, QuerySearchSchema } from "./generics";
import { prismaClient } from "../utils/lib/prisma-client";
// import { getPrismaClient } from "../utils/lib/prisma-client";

export const excelFileSchema = z.object(
	{
		nomina: z.object({
			mimetype: z.literal(
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				{ description: "El archivo debe ser formato xlsx" },
			),
			size: z
				.number()
				.max(2 * 1024 * 1024, "El archivo no debe superar los 2MB"), // Máximo 2MB
			data: z.instanceof(Buffer, {
				message: "No se envio el archivo correctamente",
			}), //Debe tener un buffer de datos adentro
		}),
	},
	{ message: "Debe enviar un archivo de nomina" },
);

export const validScoutID = async (id: string) => {
	const ScoutModel = prismaClient.scout;
	const respItem = await ScoutModel.findUnique({ where: { uuid: id } });
	return !!respItem;
};

const ScoutBaseSchema = z.object({
	nombre: z.string().max(100).regex(lettersReg),
	apellido: z.string().max(100).regex(lettersReg),
	fechaNacimiento: z.date(),
	dni: z.string().max(10).regex(numberReg),
	sexo: z.enum(VALID_SEX).optional().nullable(),
	localidad: z.string().max(100).regex(lettersReg),
	direccion: z.string().max(100).regex(directionReg),
	codigoPostal: z.string().max(20).optional().nullable(),
	afiliado: z.boolean().optional().default(true),
	provincia: z.string().max(100).regex(lettersReg),
	nacionalidad: z.string().max(100).regex(lettersReg),
	telefono: z.string().max(15).regex(numberReg).nullable(),
	mail: z.string().min(1).email().nullable(),
	religion: z.enum(VALID_RELIGIONS),
	equipoId: IdSchema.max(10).nullable(),
	funcion: z.enum(VALID_FUNCTIONS),
	rama: z.enum(VALID_RAMAS),
	progresionActual: z.enum(VALID_PROGRESSIONS).nullable(),
});

export const ScoutSchema = ScoutBaseSchema.refine(
	(data) => {
		if (!data.progresionActual) return true;
		return PROGRESIONES_POR_RAMA[data.rama].includes(
			data.progresionActual as never,
		);
	},
	{
		message: "La progresionActual no corresponde a la rama",
		path: ["progresionActual"],
	},
) satisfies z.Schema<IScout>;

export const GetScoutsSchema = z.object({
	query: QuerySearchSchema.extend({
		orderBy: z.enum(VALID_GET_SCOUTS_FILTERS).optional(),
	}),
	// TODO: Agregar validacion de filtros
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
	body: ScoutBaseSchema.omit({ funcion: true }).deepPartial(),
});

export const DeleteScoutSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validScoutID),
	}),
});

export const ImportScoutsSchema = z.object({
	files: excelFileSchema,
});
