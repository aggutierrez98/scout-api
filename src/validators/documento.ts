import { z } from "zod";
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
	return !!respItem?.completableDinamicamente
};

export const validDocumentoDefinicionId = async (id: string) => {
	const respItem = await prismaClient.documento.findUnique({ where: { uuid: id } });
	return !!respItem;
};

export const DocumentoSchema = z.object({
	scoutId: z.string().refine(validScoutID),
	documentoId: z.string().refine(validDocumentoDefinicionId),
	fechaPresentacion: z.date().optional(),
	uploadId: z.string().regex(nanoIdRegex).optional(),
}) satisfies z.Schema<IDocumento>;

const stringToJSONSchema = z.string()
	.transform((str, ctx): z.infer<ReturnType<any>> => {
		try {
			return JSON.parse(str)
		} catch (e) {
			ctx.addIssue({ code: 'custom', message: 'Invalid JSON' })
			return z.NEVER
		}
	})

const RetiroPersonaManualSchema = z.object({
	nombre: z.string().min(1),
	apellido: z.string().min(1),
	dni: z.string().min(1),
	parentesco: z.string().min(1),
});

const SaludDataSchema = z.record(
	z.string(),
	z.union([z.string(), z.number(), z.boolean()]).transform((value) => String(value)),
);

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
	transporteContratadoOpcion: z.enum(["SI", "NO"]).optional(),
	transporteAlternativoDescripcion: z.string().optional(),
	transporteLlegadaDiaHorario: z.string().optional(),
	transporteRetiroDiaHorario: z.string().optional(),
	transporteCelularContacto: z.string().optional(),
	avalAclaracion: z.string().optional(),
	avalDni: z.string().optional(),
	avalFuncionGrupoScout: z.string().optional(),
	listaPagos: z.array(z.object({
		monto: z.number().min(0),
		concepto: z.string().max(100),
	})).optional(),
	tipoEvento: z.enum(VALID_TIPOS_EVENTO).optional(),
	retiroData: stringToJSONSchema.pipe(z.object({
		solo: z.boolean().optional(),
		personas: z.array(z.union([z.string(), RetiroPersonaManualSchema])).optional()
	})).optional(),
	saludData: stringToJSONSchema.pipe(SaludDataSchema).optional(),
}).superRefine(async ({ documentoId, familiarId }, ctx) => {
	const respItem = await prismaClient.documento.findUnique({ where: { uuid: documentoId } });
	if (!respItem) return
	if (respItem.requiereDatosFamiliar) {
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
	if (respItem.requiereFirmaFamiliar) {
		if (!files?.signature) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["files", "signature"],
				fatal: true,
				message: "La firma del familiar es requerida para el documento",
			});
		}
	}
});

export const UploadDocumentSchema = z.object({
	body: SignDataSchema.omit({ theme: true }),
	files: filesSchema.omit({ signature: true })
});

export const GetDocumentosPendientesSchema = z.object({
	query: QuerySearchSchema.extend({
		familiarId: z.string().optional().refine(
			async (id) => (id ? validFamiliarID(id) : true),
			{ message: "Familiar no encontrado" },
		),
		soloCompletable: z.enum(["true", "false"]).optional(),
	}),
});

export const GetDocumentosSchema = z.object({
	query: QuerySearchSchema.extend({
		nombre: z.string().max(85).optional(),
		requiereRenovacionAnual: z.enum(["true", "false"]).optional(),
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

export const ScanDocumentoSchema = z.object({});

export const ConfirmScanDocumentoSchema = z.object({
	body: z.object({
		scoutId: z.string().refine(validScoutID),
		familiarId: z.string().optional(),
		documentoId: z.string().refine(validDocumentoDefinicionId),
		fechaPresentacion: z.coerce.date().optional(),
	}),
});
