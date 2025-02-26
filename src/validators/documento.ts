import { z } from "zod";
import { IDocumento } from "../types";
import { validScoutID } from "./scout";
import { ISODateStringReg, nanoIdRegex, numberReg } from "../utils/regex";
import { IdSchema, QuerySearchSchema } from "./generics";
import { prismaClient } from "../utils/lib/prisma-client";
import { validFamiliarID } from ".";

export const fileSchema = z.object({
	signature: z.object({
		fieldname: z.string(),
		originalname: z.string(),
		mimetype: z.string().regex(/^image\/(png)$/), // Permitimos solo imágenes PNG
		size: z.number().max(5 * 1024 * 200), // Max 200KB de tamaño
		buffer: z.instanceof(Buffer),
	})
});

export const validDocumentoId = async (id: string) => {
	const DocumentoModel = prismaClient.documentoPresentado;
	const respItem = await DocumentoModel.findUnique({ where: { uuid: id } });
	return !!respItem;
};

export const validDocumentoCompletableId = async (id: string) => {
	const DocumentoDataModel = prismaClient.documento;
	const respItem = await DocumentoDataModel.findUnique({ where: { uuid: id } });
	return !!respItem?.completable
};

export const DocumentoSchema = z.object({
	scoutId: z.string().refine(validScoutID),
	documentoId: z.string().refine(validDocumentoCompletableId),
	fechaPresentacion: z.date().optional(),
	uploadId: z.string().regex(nanoIdRegex).optional(),
}) satisfies z.Schema<IDocumento>;

export const FillDataSchema = z.object({
	scoutId: z.string().refine(validScoutID),
	documentoId: z.string().refine(validDocumentoCompletableId),
	theme: z.enum(["light", "dark"]).optional(),
	familiarId: z.string().refine(validFamiliarID).optional(),
	cicloActividades: z.string().regex(numberReg).optional(),
	rangoDistanciaPermiso: z.string().optional(),
})

export const FillDocumentSchema = z.object({
	body: FillDataSchema,
	files: fileSchema.optional()
})

export const GetDocumentosSchema = z.object({
	query: QuerySearchSchema.extend({
		// equipo: IdSchema.max(10).regex(numberReg).optional(),
		// nombre: z.string().max(85).regex(nameRegex).optional(),
		// funcion: z.enum(VALID_FUNCTIONS).optional(),
		// sexo: z.enum(VALID_SEX).optional(),
		// progresion: z.enum(VALID_PROGRESSIONS).optional(),
		tiempoDesde: z.string().regex(ISODateStringReg).optional(),
		tiempoHasta: z.string().regex(ISODateStringReg).optional(),
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
