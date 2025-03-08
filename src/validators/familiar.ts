import { z } from "zod";
import { VALID_ESTADO_CIVIL, VALID_RELATIONSHIPS, VALID_SEX } from "../utils";
import { IFamiliar } from "../types";
import { directionReg, lettersReg, nameRegex, numberReg } from "../utils/regex";
import { validScoutID } from ".";
import { IdSchema, QuerySearchSchema } from "./generics";
import { prismaClient } from "../utils/lib/prisma-client";

export const validFamiliarID = async (id: string) => {
	const FamiliarModel = prismaClient.familiar;
	const respItem = await FamiliarModel.findUnique({
		where: { uuid: id },
	});
	return !!respItem;
};

// export const idIsNotFamily = async (id: string) => {
// 	const FamiliarScoutModel = prismaClient.familiarScout;
// 	const respItem = await FamiliarScoutModel.findUnique({
// 		where: { scoutId: id,  },
// 	});
// 	return !!respItem;
// };

export const FamiliarSchema = z.object({
	nombre: z.string().max(100).regex(lettersReg),
	apellido: z.string().max(100).regex(lettersReg),
	fechaNacimiento: z.date(),
	dni: z.string().max(10).regex(numberReg),
	sexo: z.enum(VALID_SEX),
	localidad: z.string().max(100).regex(lettersReg),
	direccion: z.string().max(100).regex(directionReg),
	provincia: z.string().max(100).regex(lettersReg),
	nacionalidad: z.string().max(100).regex(lettersReg),
	telefono: z.string().max(15).regex(numberReg).nullable(),
	mail: z.string().min(1).email().nullable(),
	estadoCivil: z.enum(VALID_ESTADO_CIVIL).optional()
}) satisfies z.Schema<IFamiliar>;

export const UnrelateFamiliarSchema = z.object({
	body: z.object({
		scoutId: IdSchema.refine(validScoutID),
	}),
	params: z.object({
		id: IdSchema.refine(validFamiliarID),
	}),
});

export const RelateFamiliarParams = z.object({
	body: z.object({
		scoutId: IdSchema.refine(validScoutID),
		relation: z.enum(VALID_RELATIONSHIPS).optional(),
	}),
	params: z.object({
		id: IdSchema.refine(validFamiliarID),
	})
}).refine(async ({ body, params }) => {
	const FamiliarScoutModel = prismaClient.familiarScout;
	const respItem = await FamiliarScoutModel.findFirst({
		where: { scoutId: body.scoutId, familiarId: params.id },
	});

	return !respItem
}, "El parametro enviado ya esta registrado como familiar dentro del sistema");

export const GetFamiliarSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validFamiliarID),
	}),
});

export const GetFamiliaresSchema = z.object({
	query: QuerySearchSchema.extend({
		scoutId: IdSchema.refine(validScoutID).optional(),
		// nombre: z.string().max(85).regex(nameRegex).optional(),
	}).optional(),
});

export const PostFamiliarSchema = z.object({
	body: FamiliarSchema,
});

export const PutFamiliarSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validFamiliarID),
	}),
	body: FamiliarSchema.deepPartial(),
});

export const DeleteFamiliarSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validFamiliarID),
	}),
});
