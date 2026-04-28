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

const getEstadoObligacion = (montoEsperado: number, montoCondonado: number, montoImputado: number) => {
	const pendiente = Number((montoEsperado - montoCondonado - montoImputado).toFixed(2));
	if (pendiente <= 0) return "AL_DIA";
	if (montoImputado > 0 || montoCondonado > 0) return "INCOMPLETO";
	return "PENDIENTE";
};

export class ServicioImputacionPago {
	private servicioObligaciones = new ServicioObligacionesPago();

	private aplicarBonificacionAnual = async ({
		tx,
		ciclo,
		scoutId,
		disponible,
	}: {
		tx: any;
		ciclo: any;
		scoutId: string;
		disponible: number;
	}) => {
		// ciclo ya viene precargado — evitamos el findUnique dentro de la tx
		const reglaAnual = ciclo?.reglaDescuentoPagoAnual;
		if (!reglaAnual?.habilitado || !reglaAnual.mesBonificado) return disponible;

		const obligacionesCuota = await tx.obligacionPago.findMany({
			where: {
				cicloId: ciclo.uuid,
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
				estado: "AL_DIA",
			},
		});
		return disponible;
	};

	imputarPago = async (pagoId: string) => {
		// ── Prefetch: todas las queries FUERA de la transacción en paralelo ──────
		const [pagoBase, ciclo] = await Promise.all([
			(prismaClient as any).pago.findUnique({
				where: { uuid: pagoId },
				select: { uuid: true, monto: true, scoutId: true, fechaPago: true },
			}),
			this.servicioObligaciones.obtenerCicloActivo(),
		]);

		if (!pagoBase) return null;

		// familiaClave y count en paralelo
		const [familiaClave, totalObligacionesScout] = await Promise.all([
			obtenerFamiliaClavePorScout(pagoBase.scoutId),
			(prismaClient as any).obligacionPago.count({
				where: { cicloId: ciclo.uuid, scoutId: pagoBase.scoutId },
			}),
		]);

		if (totalObligacionesScout === 0) {
			await this.servicioObligaciones.generarObligacionesCiclo(ciclo.uuid);
		}

		// ── Transacción: solo escrituras + queries mínimas ────────────────────
		return (prismaClient as any).$transaction(async (tx: any) => {
			const pago = pagoBase;

			const [saldo, obligaciones] = await Promise.all([
				tx.saldoAFavor.findUnique({
					where: {
						familiaClave_cicloId: { familiaClave, cicloId: ciclo.uuid },
					},
				}),
				tx.obligacionPago.findMany({
					where: {
						cicloId: ciclo.uuid,
						estado: { in: ["PENDIENTE", "INCOMPLETO"] },
						OR: [{ scoutId: pago.scoutId }, { familiaClave }],
					},
					include: {
						imputaciones: { select: { montoImputado: true } },
					},
					orderBy: [{ periodo: "asc" }, { tipo: "asc" }],
				}),
			]);

			let disponible = Number((pago.monto + (saldo?.montoDisponible ?? 0)).toFixed(2));

			disponible = await this.aplicarBonificacionAnual({
				tx,
				ciclo,
				scoutId: pago.scoutId,
				disponible,
			});

			// ── Calcular todas las imputaciones en memoria ────────────────────
			const imputacionesACrear: Array<{
				uuid: string;
				pagoId: string;
				obligacionId: string;
				montoImputado: number;
			}> = [];
			// Estado final de cada obligación imputada (calculado en memoria)
			const estadosAActualizar: Array<{
				uuid: string;
				montoImputado: number;
				montoCondonado: number;
				montoEsperado: number;
				montoImputadoAdicional: number;
			}> = [];

			for (const obligacion of obligaciones) {
				if (disponible <= 0) break;
				const pendiente = calcularPendienteObligacion(obligacion);
				if (pendiente <= 0) continue;

				const montoImputado = Number(Math.min(disponible, pendiente).toFixed(2));
				if (montoImputado <= 0) continue;

				imputacionesACrear.push({
					uuid: nanoid(10),
					pagoId: pago.uuid,
					obligacionId: obligacion.uuid,
					montoImputado,
				});
				estadosAActualizar.push({
					uuid: obligacion.uuid,
					montoEsperado: obligacion.montoEsperado,
					montoCondonado: obligacion.montoCondonado,
					montoImputado: (obligacion.imputaciones ?? []).reduce(
						(acc: number, i: any) => acc + i.montoImputado,
						0,
					),
					montoImputadoAdicional: montoImputado,
				});
				disponible = Number((disponible - montoImputado).toFixed(2));
			}

			// ── Writes en batch paralelo ──────────────────────────────────────
			const montoDisponible = Number(Math.max(disponible, 0).toFixed(2));

			await Promise.all([
				// createMany para imputaciones (1 query en vez de N)
				imputacionesACrear.length > 0
					? tx.imputacionPago.createMany({ data: imputacionesACrear })
					: Promise.resolve(),
				// upsert de saldo a favor
				tx.saldoAFavor.upsert({
					where: { familiaClave_cicloId: { familiaClave, cicloId: ciclo.uuid } },
					create: {
						uuid: nanoid(10),
						familiaClave,
						cicloId: ciclo.uuid,
						montoDisponible,
						origen: `Pago ${pago.uuid}`,
					},
					update: { montoDisponible, origen: `Pago ${pago.uuid}` },
				}),
			]);

			// ── Actualizar estados de obligaciones en paralelo ────────────────
			// El estado se calcula en memoria para evitar un findUnique por obligación
			if (estadosAActualizar.length > 0) {
				await Promise.all(
					estadosAActualizar.map(({ uuid, montoEsperado, montoCondonado, montoImputado, montoImputadoAdicional }) => {
						const totalImputado = montoImputado + montoImputadoAdicional;
						const estado = getEstadoObligacion(montoEsperado, montoCondonado, totalImputado);
						return tx.obligacionPago.update({ where: { uuid }, data: { estado } });
					}),
				);
			}

			console.log("Imputación completa para pago:", pago.uuid);

			return {
				pagoId: pago.uuid,
				cicloId: ciclo.uuid,
				familiaClave,
				imputaciones: imputacionesACrear.map(({ obligacionId, montoImputado }) => ({
					obligacionId,
					montoImputado,
				})),
				saldoAFavor: montoDisponible,
			};
		}, { timeout: 15_000 });
	};

	reimputarPagosCiclo = async (cicloId: string) => {
		await (prismaClient as any).$transaction(async (tx: any) => {
			await tx.imputacionPago.deleteMany({
				where: { obligacion: { cicloId } },
			});
			await tx.obligacionPago.updateMany({
				where: { cicloId },
				data: { estado: "PENDIENTE" },
			});
		}, { timeout: 30_000 });

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
