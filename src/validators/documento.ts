import { z, ZodIssueCode } from "zod";
import { IDocumento } from "../types";
import { validScoutID } from "./scout";
import { ISODateStringReg, nanoIdRegex, numberReg } from "../utils/regex";
import { IdSchema, QuerySearchSchema } from "./generics";
import { prismaClient } from "../utils/lib/prisma-client";
import { validFamiliarID } from ".";
import { VALID_TIPOS_EVENTO } from '../utils/constants';

export const filesSchema = z.object({
	signature: z.object({
		mimetype: z.string().regex(/^image\/(png)$/, { message: "La imagen no tiene un formato valido" }), // Permitimos solo imágenes PNG
		size: z.number().max(5 * 1024 * 200, "El archivo no debe superar los 200KB"), // Max 200KB de tamaño
		data: z.instanceof(Buffer, { message: "No se envio el archivo correctamente" }), //Debe tener un buffer de datos adentro
	}).optional().nullable(),
	documentoFilled: z.object({
		mimetype: z.string().regex(/^application\/(pdf)$/, { message: "El documento no tiene un formato valido" }), // Permitimos solo archivos pdf
		size: z.number().max(5 * 1024 * 200, "El archivo no debe superar los 500KB"), // Max 200KB de tamaño
		data: z.instanceof(Buffer, { message: "No se envio el archivo correctamente" }), //Debe tener un buffer de datos adentro
	}).optional().nullable(),
})

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
	requiereFamiliar: z.boolean().default(false),
	requiereFirma: z.boolean().default(false),
	uploadId: z.string().regex(nanoIdRegex).optional(),
}) satisfies z.Schema<IDocumento>;

const parseJsonPreprocessor = (value: any, ctx: z.RefinementCtx) => {
	if (typeof value === 'string') {
		console.log({ value });
		try {
			return JSON.parse(value);
		} catch (e) {
			ctx.addIssue({
				code: ZodIssueCode.custom,
				message: (e as Error).message,
			});
		}
	}
	return value;
};




// retiroData: z.preprocess(parseJsonPreprocessor, z.object({
// 	solo: z.boolean().optional(),
// 	personas: z.array(z.string()).optional()
// }).optional()).optional()

const stringToJSONSchema = z.string()
	.transform((str, ctx): z.infer<ReturnType<any>> => {
		try {
			return JSON.parse(str)
		} catch (e) {
			ctx.addIssue({ code: 'custom', message: 'Invalid JSON' })
			return z.NEVER
		}
	})

export const FillDataSchema = z.object({
	scoutId: z.string().refine(validScoutID).optional(),
	documentoId: z.string().refine(validDocumentoCompletableId),
	theme: z.enum(["light", "dark"]).optional(),
	familiarId: z.string().refine(validFamiliarID).optional(),
	cicloActividades: z.string().regex(numberReg).optional().default((new Date()).getFullYear().toString()),
	rangoDistanciaPermiso: z.string().optional().default("5 km"),
	aclaraciones: z.string().optional(),
	lugarEvento: z.string().optional(),
	fechaEventoComienzo: z.coerce.date().optional(),
	fechaEventoFin: z.coerce.date().optional(),
	fechaPago: z.coerce.date().optional(),
	listaPagos: z.array(z.object({
		monto: z.number().min(0),
		concepto: z.string().max(100),
	})).optional(),
	tipoEvento: z.enum(VALID_TIPOS_EVENTO).optional(),
	retiroData: stringToJSONSchema.pipe(z.object({
		solo: z.boolean().optional(),
		personas: z.array(z.string()).optional()
	})).optional(),
}).superRefine(async ({ documentoId, familiarId }, ctx) => {
	const respItem = await prismaClient.documento.findUnique({ where: { uuid: documentoId } });
	if (!respItem) return
	if (respItem.requiereFamiliar) {
		if (!familiarId) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["familiarId"],
				fatal: true,
				message: "Es necesario que sea un familiar quien completa este documento",
			});
		}
	}
});

export const SignDataSchema = z.object({
	scoutId: z.string().refine(validScoutID),
	documentoId: z.string().refine(validDocumentoCompletableId),
	theme: z.enum(["light", "dark"]).optional(),
})

export const FillDocumentSchema = z.object({
	body: FillDataSchema,
})

export const SignDocumentSchema = z.object({
	body: SignDataSchema.omit({ scoutId: true }),
	files: filesSchema
}).superRefine(async ({ body: { documentoId }, files }, ctx) => {
	const respItem = await prismaClient.documento.findUnique({ where: { uuid: documentoId } });
	if (!respItem) return
	if (respItem.requiereFirma) {
		if (!files?.signature) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["files", "signature"],
				fatal: true,
				message: "La firma es requerida para el documento",
			});
		}
	}
});

export const UploadDocumentSchema = z.object({
	body: SignDataSchema.omit({ theme: true }),
	files: filesSchema.omit({ signature: true })
});

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
