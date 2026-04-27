import { nanoid } from "nanoid";
import { prismaClient } from "../utils/lib/prisma-client";
import { obtenerFamiliaClavePorScout } from "./pagoFamilia";
import { ServicioObligacionesPago } from "./servicioObligacionesPago";

const calcularPendienteObligacion = (obligacion: any) => {
	const montoImputado = (obligacion.imputaciones ?? []).reduce(
		(acc: number, item: any) => acc + item.montoImputado,
		0,
	);
	return Number((obligacion.montoEsperado - obligacion.montoCondonado - montoImputado).toFixed(2));
};

export class ServicioImputacionPago {
	private servicioObligaciones = new ServicioObligacionesPago();

	private aplicarBonificacionAnual = async ({
		tx,
		cicloId,
		scoutId,
		disponible,
	}: {
		tx: any;
		cicloId: string;
		scoutId: string;
		disponible: number;
	}) => {
		const ciclo = await tx.cicloReglasPago.findUnique({
			where: { uuid: cicloId },
			include: { reglaDescuentoPagoAnual: true },
		});
		const reglaAnual = ciclo?.reglaDescuentoPagoAnual;
		if (!reglaAnual?.habilitado || !reglaAnual.mesBonificado) return disponible;

		const obligacionesCuota = await tx.obligacionPago.findMany({
			where: {
				cicloId,
				scoutId,
				tipo: "CUOTA_MENSUAL",
			},
			include: {
				imputaciones: {
					select: { montoImputado: true },
				},
			},
		});

		if (obligacionesCuota.length === 0) return disponible;

		let totalPendiente = 0;
		let obligacionBonificada: any | null = null;
		let pendienteBonificada = 0;

		for (const obligacion of obligacionesCuota) {
			const pendiente = calcularPendienteObligacion(obligacion);
			if (pendiente <= 0) continue;
			totalPendiente += pendiente;
			const mesPeriodo = Number(obligacion.periodo.split("-")[1]);
			if (mesPeriodo === reglaAnual.mesBonificado) {
				obligacionBonificada = obligacion;
				pendienteBonificada = pendiente;
			}
		}

		if (!obligacionBonificada || pendienteBonificada <= 0) return disponible;
		const totalConBonificacion = Number((totalPendiente - pendienteBonificada).toFixed(2));

		if (disponible < totalConBonificacion) return disponible;

		await tx.condonacionPago.create({
			data: {
				uuid: nanoid(10),
				obligacionId: obligacionBonificada.uuid,
				montoCondonado: pendienteBonificada,
				motivo: "Bonificación automática por pago anual",
				condonadoPorUserId: null,
			},
		});
		await tx.obligacionPago.update({
			where: { uuid: obligacionBonificada.uuid },
			data: {
				montoCondonado: { increment: pendienteBonificada },
			},
		});
		await this.servicioObligaciones.recalcularEstadoObligacion(obligacionBonificada.uuid, tx);
		return disponible;
	};

	imputarPago = async (pagoId: string) => {
		const pagoBase = await (prismaClient as any).pago.findUnique({
			where: { uuid: pagoId },
			select: {
				uuid: true,
				monto: true,
				scoutId: true,
				fechaPago: true,
			},
		});
		if (!pagoBase) return null;

		const ciclo = await this.servicioObligaciones.obtenerCicloActivo();
		const totalObligacionesScout = await (prismaClient as any).obligacionPago.count({
			where: { cicloId: ciclo.uuid, scoutId: pagoBase.scoutId },
		});
		if (totalObligacionesScout === 0) {
			await this.servicioObligaciones.generarObligacionesCiclo(ciclo.uuid);
		}

		return (prismaClient as any).$transaction(async (tx: any) => {
			const pago = pagoBase;
			const familiaClave = await obtenerFamiliaClavePorScout(pago.scoutId);

			const saldo = await tx.saldoAFavor.findUnique({
				where: {
					familiaClave_cicloId: {
						familiaClave,
						cicloId: ciclo.uuid,
					},
				},
			});

			let disponible = Number((pago.monto + (saldo?.montoDisponible ?? 0)).toFixed(2));

			disponible = await this.aplicarBonificacionAnual({
				tx,
				cicloId: ciclo.uuid,
				scoutId: pago.scoutId,
				disponible,
			});

			const obligaciones = await tx.obligacionPago.findMany({
				where: {
					cicloId: ciclo.uuid,
					estado: { in: ["PENDIENTE", "INCOMPLETO"] },
					OR: [{ scoutId: pago.scoutId }, { familiaClave }],
				},
				include: {
					imputaciones: {
						select: { montoImputado: true },
					},
				},
				orderBy: [{ periodo: "asc" }, { tipo: "asc" }],
			});

			const imputaciones: Array<{ obligacionId: string; montoImputado: number }> = [];
			for (const obligacion of obligaciones) {
				if (disponible <= 0) break;
				const pendiente = calcularPendienteObligacion(obligacion);
				if (pendiente <= 0) continue;

				const montoImputado = Number(Math.min(disponible, pendiente).toFixed(2));
				if (montoImputado <= 0) continue;

				await tx.imputacionPago.create({
					data: {
						uuid: nanoid(10),
						pagoId: pago.uuid,
						obligacionId: obligacion.uuid,
						montoImputado,
					},
				});
				await this.servicioObligaciones.recalcularEstadoObligacion(obligacion.uuid, tx);
				imputaciones.push({ obligacionId: obligacion.uuid, montoImputado });
				disponible = Number((disponible - montoImputado).toFixed(2));
			}

			const montoDisponible = Number(Math.max(disponible, 0).toFixed(2));
			await tx.saldoAFavor.upsert({
				where: {
					familiaClave_cicloId: {
						familiaClave,
						cicloId: ciclo.uuid,
					},
				},
				create: {
					uuid: nanoid(10),
					familiaClave,
					cicloId: ciclo.uuid,
					montoDisponible,
					origen: `Pago ${pago.uuid}`,
				},
				update: {
					montoDisponible,
					origen: `Pago ${pago.uuid}`,
				},
			});

			return {
				pagoId: pago.uuid,
				cicloId: ciclo.uuid,
				familiaClave,
				imputaciones,
				saldoAFavor: montoDisponible,
			};
		});
	};

	reimputarPagosCiclo = async (cicloId: string) => {
		await (prismaClient as any).$transaction(async (tx: any) => {
			await tx.imputacionPago.deleteMany({
				where: { obligacion: { cicloId } },
			});
			await tx.saldoAFavor.deleteMany({ where: { cicloId } });
			await tx.obligacionPago.updateMany({
				where: { cicloId },
				data: { estado: "PENDIENTE" },
			});
		});

		const ciclo = await (prismaClient as any).cicloReglasPago.findUnique({ where: { uuid: cicloId } });
		if (!ciclo) return { procesados: 0 };

		const pagos = await (prismaClient as any).pago.findMany({
			where: {
				fechaPago: {
					gte: ciclo.fechaInicio,
					lte: ciclo.fechaFin,
				},
			},
			orderBy: [{ fechaPago: "asc" }, { fechaCreacion: "asc" }],
			select: { uuid: true },
		});

		for (const pago of pagos) {
			await this.imputarPago(pago.uuid);
		}

		return { procesados: pagos.length };
	};
}
