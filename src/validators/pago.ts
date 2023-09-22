import { z } from "zod";
import { IdSchema, QuerySearchSchema } from "./http";
import { PrismaClient } from "@prisma/client";
import { IPago } from "../types";
import { validScoutID } from "./scout";
import { VALID_FUNCTIONS, VALID_METODOS_PAGO } from "../utils";
import { nameRegex, numberReg } from "./regex";

const validPagoId = async (id: string) => {
	const prisma = new PrismaClient();
	const ParullaModel = prisma.pago;
	const respItem = await ParullaModel.findUnique({ where: { id: Number(id) } });
	return !!respItem;
};

export const PagoSchema = z.object({
	concepto: z.string().max(50),
	monto: z.number().max(99999999),
	metodoPago: z.enum(VALID_METODOS_PAGO),
	scoutId: z.string().refine(validScoutID),
	fechaPago: z.date(),
}) satisfies z.Schema<IPago>;

export const GetPagosSchema = z.object({
	query: QuerySearchSchema.extend({
		patrulla: z.string().max(10).regex(numberReg).optional(),
		nombre: z.string().max(85).regex(nameRegex).optional(),
		tiempoDesde: z.date().max(new Date()).optional(),
		tiempoHasta: z.date().min(new Date()).optional(),
		concepto: z.string().max(50).optional(),
		funcion: z.enum(VALID_FUNCTIONS).optional(),
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
