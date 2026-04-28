import { z } from "zod";
import { IPago } from "../types";
import { validScoutID } from "./scout";
import { VALID_FUNCTIONS, VALID_METODOS_PAGO, VALID_RAMAS } from "../utils";
import { ISODateStringReg } from "../utils/regex";
import { IdSchema, QuerySearchSchema } from "./generics";
import { prismaClient } from "../utils/lib/prisma-client";

const validPagoId = async (id: string) => {
	const respItem = await prismaClient.pago.findUnique({ where: { uuid: id } });
	return !!respItem;
};

const validCicloReglaId = async (id: string) => {
	const respItem = await (prismaClient as any).cicloReglasPago.findUnique({ where: { uuid: id } });
	return !!respItem;
};

const validObligacionId = async (id: string) => {
	const respItem = await (prismaClient as any).obligacionPago.findUnique({ where: { uuid: id } });
	return !!respItem;
};

const EstadoObligacionSchema = z.enum(["PENDIENTE", "INCOMPLETO", "AL_DIA"]);

const ReglaAfiliacionSchema = z.object({
	funcionScout: z
		.string()
		.min(1, "La función es obligatoria")
		.refine(
			(value) => (VALID_FUNCTIONS as readonly string[]).includes(value),
			"La función seleccionada no es válida",
		),
	monto: z.number().positive("El monto debe ser mayor a 0"),
	obligatoria: z.boolean().optional().default(true),
});

const ReglaCuotaMensualSchema = z.object({
	mes: z.number().int().min(1, "El mes debe ser entre 1 y 12").max(12, "El mes debe ser entre 1 y 12"),
	montoBase: z.number().positive("El monto base debe ser mayor a 0"),
	cobrable: z.boolean().optional().default(true),
});

const ReglaDescuentoPagoAnualSchema = z.object({
	habilitado: z.boolean(),
	mesBonificado: z
		.number()
		.int()
		.min(1, "El mes bonificado debe ser entre 1 y 12")
		.max(12, "El mes bonificado debe ser entre 1 y 12")
		.nullable()
		.optional(),
}).superRefine((value, ctx) => {
	if (value.habilitado && !value.mesBonificado) {
		ctx.addIssue({
			code: "custom",
			message: "Si el descuento anual está habilitado, debe indicar el mes bonificado",
			path: ["mesBonificado"],
		});
	}
});

const ReglaDescuentoFamiliarSchema = z
	.object({
		cantidadMinima: z.number().int().min(1, "La cantidad mínima debe ser mayor o igual a 1"),
		cantidadMaxima: z.number().int().min(1).nullable().optional(),
		montoPorScout: z.number().positive("El monto por scout debe ser mayor a 0"),
	})
	.superRefine((value, ctx) => {
		if (value.cantidadMaxima != null && value.cantidadMaxima < value.cantidadMinima) {
			ctx.addIssue({
				code: "custom",
				message: "cantidadMaxima no puede ser menor a cantidadMinima",
				path: ["cantidadMaxima"],
			});
		}
	});

const ReglasPagoBodySchema = z.object({
	anio: z.number().int().min(2026, "El año debe ser 2026 o mayor"),
	activo: z.boolean().optional(),
	fechaInicio: z.string().pipe(z.coerce.date()),
	fechaFin: z.string().pipe(z.coerce.date()),
	afiliacion: z.array(ReglaAfiliacionSchema).min(1, "Debe configurar al menos una regla de afiliación"),
	cuotasMensuales: z.array(ReglaCuotaMensualSchema).min(1, "Debe configurar al menos una cuota mensual"),
	descuentoPagoAnual: ReglaDescuentoPagoAnualSchema,
	descuentosFamiliares: z.array(ReglaDescuentoFamiliarSchema).min(1, "Debe configurar al menos una regla familiar"),
	cbusAceptados: z.array(z.string().min(1)).default([]),
}).superRefine((value, ctx) => {
	if (value.fechaInicio >= value.fechaFin) {
		ctx.addIssue({
			code: "custom",
			message: "fechaInicio debe ser anterior a fechaFin",
			path: ["fechaInicio"],
		});
	}

	const meses = new Set<number>();
	for (const cuota of value.cuotasMensuales) {
		if (meses.has(cuota.mes)) {
			ctx.addIssue({
				code: "custom",
				message: `El mes ${cuota.mes} está repetido en cuotasMensuales`,
				path: ["cuotasMensuales"],
			});
		}
		meses.add(cuota.mes);
	}

	const funcionesAfiliacion = new Set<string>();
	for (const regla of value.afiliacion) {
		if (funcionesAfiliacion.has(regla.funcionScout)) {
			ctx.addIssue({
				code: "custom",
				message: `La función ${regla.funcionScout} está repetida en afiliación`,
				path: ["afiliacion"],
			});
		}
		funcionesAfiliacion.add(regla.funcionScout);
	}
});

export const PagoSchema = z.object({
	concepto: z.string().max(50),
	monto: z.number(),
	metodoPago: z.enum(VALID_METODOS_PAGO),
	scoutId: IdSchema.refine(validScoutID),
	fechaPago: z.string().pipe(z.coerce.date()),
}) satisfies z.Schema<IPago>;

export const GetPagosSchema = z.object({
	query: QuerySearchSchema.extend({
		tiempoDesde: z.string().regex(ISODateStringReg).optional(),
		tiempoHasta: z.string().regex(ISODateStringReg).optional(),
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

export const GetReglasPagoActivaSchema = z.object({});

export const PostReglasPagoSchema = z.object({
	body: ReglasPagoBodySchema,
});

export const PutReglasPagoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validCicloReglaId),
	}),
	body: ReglasPagoBodySchema,
});

export const ActivarReglasPagoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validCicloReglaId),
	}),
});

export const GetPendientesPagoSchema = z.object({
	query: QuerySearchSchema.extend({
		rama: z.enum(VALID_RAMAS).optional(),
		scoutId: IdSchema.optional(),
		scoutNombre: z.string().min(1).max(120).optional(),
		familiaClave: z.string().min(1).optional(),
		estado: EstadoObligacionSchema.optional(),
	}),
});

export const GetPendientePagoDetalleSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validObligacionId),
	}),
});

export const PerdonarPendientePagoSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validObligacionId),
	}),
	body: z.object({
		motivo: z.string().min(10, "Debe ingresar un motivo de al menos 10 caracteres"),
		montoCondonado: z.number().positive("El monto condonado debe ser mayor a 0").optional(),
	}),
});
