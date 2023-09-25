import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { IDocumento } from "../types";
import { validScoutID } from "./scout";
import { VALID_FUNCTIONS, VALID_PROGRESSIONS, VALID_SEX } from "../utils";
import { nameRegex, numberReg } from "../utils/regex";
import { IdSchema, QuerySearchSchema } from "./generics";

export const validDocumentoId = async (id: string) => {
	const prisma = new PrismaClient();
	const ParullaModel = prisma.documentoPresentado;
	const respItem = await ParullaModel.findUnique({ where: { id: Number(id) } });
	return !!respItem;
};

export const DocumentoSchema = z.object({
	scoutId: z.string().refine(validScoutID),
	documentoId: z.string().refine(validDocumentoId),
	fechaPresentacion: z.date(),
}) satisfies z.Schema<IDocumento>;

export const GetDocumentosSchema = z.object({
	query: QuerySearchSchema.extend({
		documento: z.string().max(10).regex(numberReg).optional(),
		patrulla: z.string().max(10).regex(numberReg).optional(),
		nombre: z.string().max(85).regex(nameRegex).optional(),
		funcion: z.enum(VALID_FUNCTIONS).optional(),
		sexo: z.enum(VALID_SEX).optional(),
		progresion: z.enum(VALID_PROGRESSIONS).optional(),
	}),
});

export const GetDocumentoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validDocumentoId),
	}),
});

export const PostDocumentoSchema = z.object({
	body: DocumentoSchema,
});

export const DeleteDocumentoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validDocumentoId),
	}),
});
