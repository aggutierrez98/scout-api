import { nanoid } from "nanoid";
import { prismaClient } from "../../utils/lib/prisma-client";

const REGLAS_BASE_AFILIACION = [
	{ funcionScout: "JOVEN", monto: 12000 },
	{ funcionScout: "AYUDANTE_RAMA", monto: 12000 },
	{ funcionScout: "SUBJEFE_RAMA", monto: 12000 },
	{ funcionScout: "JEFE_RAMA", monto: 12000 },
	{ funcionScout: "SUBJEFE_GRUPO", monto: 12000 },
	{ funcionScout: "JEFE_GRUPO", monto: 12000 },
];

const REGLAS_BASE_FAMILIA = [
	{ cantidadMinima: 1, cantidadMaxima: 1, montoPorScout: 15000 },
	{ cantidadMinima: 2, cantidadMaxima: 2, montoPorScout: 11000 },
	{ cantidadMinima: 3, cantidadMaxima: null, montoPorScout: 7500 },
];

export const loadReglasPago = async (anio = 2026) => {
	const existente = await (prismaClient as any).cicloReglasPago.findUnique({
		where: { anio },
		select: { uuid: true },
	});

	if (existente) {
		return existente.uuid;
	}

	const inicio = new Date(Date.UTC(anio, 0, 1, 0, 0, 0));
	const fin = new Date(Date.UTC(anio, 11, 31, 23, 59, 59));
	const cicloId = nanoid(10);

	await (prismaClient as any).cicloReglasPago.create({
		data: {
			uuid: cicloId,
			anio,
			activo: true,
			fechaInicio: inicio,
			fechaFin: fin,
			reglasAfiliacion: {
				create: REGLAS_BASE_AFILIACION.map((item) => ({
					uuid: nanoid(10),
					funcionScout: item.funcionScout,
					monto: item.monto,
					obligatoria: true,
				})),
			},
			reglasCuotaMensual: {
				create: Array.from({ length: 12 }, (_, idx) => ({
					uuid: nanoid(10),
					mes: idx + 1,
					montoBase: 15000,
					cobrable: true,
				})),
			},
			reglaDescuentoPagoAnual: {
				create: {
					uuid: nanoid(10),
					habilitado: false,
					mesBonificado: null,
				},
			},
			reglasDescuentoFamiliar: {
				create: REGLAS_BASE_FAMILIA.map((item) => ({
					uuid: nanoid(10),
					cantidadMinima: item.cantidadMinima,
					cantidadMaxima: item.cantidadMaxima,
					montoPorScout: item.montoPorScout,
				})),
			},
		},
	});

	return cicloId;
};
