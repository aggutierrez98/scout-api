import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { IPago } from "../types";
import { validScoutID } from "./scout";
import { VALID_FUNCTIONS, VALID_METODOS_PAGO } from "../utils";
import { ISODateStringReg, nameRegex, numberReg } from "../utils/regex";
import { IdSchema, QuerySearchSchema } from "./generics";
const validPagoId = async (id: string) => {
	const prisma = new PrismaClient();
	const PagoModel = prisma.pago;
	console.log({ id })
	const respItem = await PagoModel.findUnique({ where: { uuid: id } });
	return !!respItem;
};

export const PagoSchema = z.object({
	concepto: z.string().max(50),
	monto: z.string().regex(numberReg).max(99999999),
	metodoPago: z.enum(VALID_METODOS_PAGO),
	scoutId: IdSchema.refine(validScoutID),
	fechaPago: z.string().pipe(z.coerce.date()),
}) satisfies z.Schema<IPago>;

export const GetPagosSchema = z.object({
	query: QuerySearchSchema.extend({
		// patrulla: z.string().max(10).regex(numberReg).optional(),
		// nombre: z.string().max(85).regex(nameRegex).optional(),
		tiempoDesde: z.string().regex(ISODateStringReg).optional(),
		tiempoHasta: z.string().regex(ISODateStringReg).optional(),
		// concepto: z.string().max(50).optional(),
		// funcion: z.enum(VALID_FUNCTIONS).optional(),
	}),
});

export const GetPagoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validPagoId),
	}),
});

export const PostPagoSchema = z.object({
	body: PagoSchema,
});

export const PutPagoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validPagoId),
	}),
	body: PagoSchema.deepPartial(),
});

export const DeletePagoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validPagoId),
	}),
});
