import { z } from "zod";
import { IdSchema, QuerySearchSchema } from "./http";
import { PrismaClient } from "@prisma/client";
import { IDocumento } from "../types";
import { validScoutID } from "./scout";
import { nameRegex, numberReg } from "./regex";
import { VALID_FUNCTIONS, VALID_PROGRESSIONS, VALID_SEX } from "../utils";

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
		documento: z.string().max(10).regex(numberReg),
		patrulla: z.string().max(10).regex(numberReg),
		nombre: z.string().max(85).regex(nameRegex),
		funcion: z.enum(VALID_FUNCTIONS),
		sexo: z.enum(VALID_SEX),
		progresion: z.enum(VALID_PROGRESSIONS),
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
