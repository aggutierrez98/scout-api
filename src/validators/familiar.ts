import { z } from "zod";
import { VALID_RELATIONSHIPS, VALID_SEX } from "../utils";
import { PrismaClient } from "@prisma/client";
import { IFamiliar } from "../types";
import { lettersReg, numberReg } from "../utils/regex";
import { IdSchema, validScoutID } from ".";

export const validFamiliarID = async (id: string) => {
	const prisma = new PrismaClient();
	const FamiliarModel = prisma.familiar;
	const respItem = await FamiliarModel.findUnique({
		where: { id: Number(id) },
	});
	return !!respItem;
};

export const FamiliarSchema = z.object({
	nombre: z.string().max(100).regex(lettersReg),
	apellido: z.string().max(100).regex(lettersReg),
	fechaNacimiento: z.date(),
	dni: z.string().max(10).regex(numberReg),
	sexo: z.enum(VALID_SEX),
	telefono: z.string().max(15).regex(numberReg),
}) satisfies z.Schema<IFamiliar>;

export const UnrelateFamiliarSchema = z.object({
	body: z.object({
		scoutId: IdSchema.refine(validScoutID),
	}),
	params: z.object({
		id: IdSchema.refine(validFamiliarID),
	}),
});

export const RelateFamiliarParams = UnrelateFamiliarSchema.extend({
	body: z.object({
		scoutId: IdSchema.refine(validScoutID),
		relation: z.enum(VALID_RELATIONSHIPS).optional(),
	}),
});

export const GetFamiliarSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validFamiliarID),
	}),
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
