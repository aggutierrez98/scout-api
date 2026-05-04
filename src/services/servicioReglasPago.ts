import { nanoid } from "nanoid";
import { ICicloReglasPagoInput } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";
import { ServicioObligacionesPago } from "./servicioObligacionesPago";

const mapReglas = (ciclo: any) => {
	if (!ciclo) return null;
	return {
		id: ciclo.uuid,
		anio: ciclo.anio,
		activo: ciclo.activo,
		fechaInicio: ciclo.fechaInicio,
		fechaFin: ciclo.fechaFin,
		fechaCreacion: ciclo.fechaCreacion,
		fechaActualizacion: ciclo.fechaActualizacion,
		afiliacion: (ciclo.reglasAfiliacion ?? []).map((item: any) => ({
			id: item.uuid,
			funcionScout: item.funcionScout,
			monto: item.monto,
			obligatoria: item.obligatoria,
		})),
		cuotasMensuales: (ciclo.reglasCuotaMensual ?? [])
			.sort((a: any, b: any) => a.mes - b.mes)
			.map((item: any) => ({
				id: item.uuid,
				mes: item.mes,
				montoBase: item.montoBase,
				cobrable: item.cobrable,
			})),
		descuentoPagoAnual: ciclo.reglaDescuentoPagoAnual
			? {
					id: ciclo.reglaDescuentoPagoAnual.uuid,
					habilitado: ciclo.reglaDescuentoPagoAnual.habilitado,
					mesBonificado: ciclo.reglaDescuentoPagoAnual.mesBonificado,
				}
			: null,
		descuentosFamiliares: (ciclo.reglasDescuentoFamiliar ?? [])
			.sort((a: any, b: any) => a.cantidadMinima - b.cantidadMinima)
			.map((item: any) => ({
				id: item.uuid,
				cantidadMinima: item.cantidadMinima,
				cantidadMaxima: item.cantidadMaxima,
				montoPorScout: item.montoPorScout,
			})),
		cbusAceptados: Array.isArray(ciclo.cbusAceptados) ? ciclo.cbusAceptados : (JSON.parse(ciclo.cbusAceptados ?? "[]") as string[]),
		exencionPrimerCiclo: {
			habilitado: ciclo.exencionPrimerCicloHabilitada ?? false,
		},
	};
};

export class ServicioReglasPago {
	private servicioObligaciones = new ServicioObligacionesPago();

	obtenerReglaActiva = async () => {
		const ciclo = await (prismaClient as any).cicloReglasPago.findFirst({
			where: { activo: true },
			include: {
				reglasAfiliacion: true,
				reglasCuotaMensual: true,
				reglaDescuentoPagoAnual: true,
				reglasDescuentoFamiliar: true,
			},
			orderBy: { anio: "desc" },
		});

		return mapReglas(ciclo);
	};

	crearBorradorReglas = async (payload: ICicloReglasPagoInput) => {
		const ciclo = await (prismaClient as any).cicloReglasPago.create({
			data: {
				uuid: nanoid(10),
				anio: payload.anio,
				activo: false,
				fechaInicio: new Date(payload.fechaInicio),
				fechaFin: new Date(payload.fechaFin),
				cbusAceptados: JSON.stringify(payload.cbusAceptados ?? []),
				exencionPrimerCicloHabilitada: payload.exencionPrimerCiclo?.habilitado ?? false,
				reglasAfiliacion: {
					create: payload.afiliacion.map((item) => ({
						uuid: nanoid(10),
						funcionScout: item.funcionScout,
						monto: item.monto,
						obligatoria: item.obligatoria ?? true,
					})),
				},
				reglasCuotaMensual: {
					create: payload.cuotasMensuales.map((item) => ({
						uuid: nanoid(10),
						mes: item.mes,
						montoBase: item.montoBase,
						cobrable: item.cobrable ?? true,
					})),
				},
				reglaDescuentoPagoAnual: {
					create: {
						uuid: nanoid(10),
						habilitado: payload.descuentoPagoAnual.habilitado,
						mesBonificado: payload.descuentoPagoAnual.mesBonificado ?? null,
					},
				},
				reglasDescuentoFamiliar: {
					create: payload.descuentosFamiliares.map((item) => ({
						uuid: nanoid(10),
						cantidadMinima: item.cantidadMinima,
						cantidadMaxima: item.cantidadMaxima ?? null,
						montoPorScout: item.montoPorScout,
					})),
				},
			},
			include: {
				reglasAfiliacion: true,
				reglasCuotaMensual: true,
				reglaDescuentoPagoAnual: true,
				reglasDescuentoFamiliar: true,
			},
		});

		if (ciclo.activo) {
			await this.servicioObligaciones.generarObligacionesCiclo(ciclo.uuid, {
				forzarRecrear: true,
			});
		}

		return mapReglas(ciclo);
	};

	actualizarReglas = async (cicloId: string, payload: ICicloReglasPagoInput) => {
		const ciclo = await (prismaClient as any).$transaction(async (tx: any) => {
			await tx.reglaAfiliacion.deleteMany({ where: { cicloId } });
			await tx.reglaCuotaMensual.deleteMany({ where: { cicloId } });
			await tx.reglaDescuentoPagoAnual.deleteMany({ where: { cicloId } });
			await tx.reglaDescuentoFamiliar.deleteMany({ where: { cicloId } });

			return tx.cicloReglasPago.update({
				where: { uuid: cicloId },
				data: {
					anio: payload.anio,
					fechaInicio: new Date(payload.fechaInicio),
					fechaFin: new Date(payload.fechaFin),
					cbusAceptados: JSON.stringify(payload.cbusAceptados ?? []),
					exencionPrimerCicloHabilitada: payload.exencionPrimerCiclo?.habilitado ?? false,
					reglasAfiliacion: {
						create: payload.afiliacion.map((item) => ({
							uuid: nanoid(10),
							funcionScout: item.funcionScout,
							monto: item.monto,
							obligatoria: item.obligatoria ?? true,
						})),
					},
					reglasCuotaMensual: {
						create: payload.cuotasMensuales.map((item) => ({
							uuid: nanoid(10),
							mes: item.mes,
							montoBase: item.montoBase,
							cobrable: item.cobrable ?? true,
						})),
					},
					reglaDescuentoPagoAnual: {
						create: {
							uuid: nanoid(10),
							habilitado: payload.descuentoPagoAnual.habilitado,
							mesBonificado: payload.descuentoPagoAnual.mesBonificado ?? null,
						},
					},
					reglasDescuentoFamiliar: {
						create: payload.descuentosFamiliares.map((item) => ({
							uuid: nanoid(10),
							cantidadMinima: item.cantidadMinima,
							cantidadMaxima: item.cantidadMaxima ?? null,
							montoPorScout: item.montoPorScout,
						})),
					},
				},
				include: {
					reglasAfiliacion: true,
					reglasCuotaMensual: true,
					reglaDescuentoPagoAnual: true,
					reglasDescuentoFamiliar: true,
				},
			});
		});

		if (ciclo.activo) {
			await this.servicioObligaciones.generarObligacionesCiclo(ciclo.uuid, {
				forzarRecrear: true,
			});
		}

		return mapReglas(ciclo);
	};

	activarReglas = async (cicloId: string) => {
		await (prismaClient as any).$transaction(async (tx: any) => {
			await tx.cicloReglasPago.updateMany({ data: { activo: false } });
			await tx.cicloReglasPago.update({
				where: { uuid: cicloId },
				data: { activo: true },
			});
		});

		await this.servicioObligaciones.generarObligacionesCiclo(cicloId, {
			forzarRecrear: true,
		});

		return this.obtenerReglaActiva();
	};
}
