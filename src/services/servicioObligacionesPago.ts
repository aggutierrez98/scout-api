import { nanoid } from "nanoid";
import { ROLES, RamasType, RolesType } from "../types";
import { AppError, HttpCode } from "../utils";
import { prismaClient } from "../utils/lib/prisma-client";
import { construirMapaFamilias, obtenerScoutIdsPorFamiliar } from "./pagoFamilia";
import { normalizeText } from "../utils/helpers/text";

const ROLES_GLOBALES_PENDIENTES: RolesType[] = [
	ROLES.JEFE_GRUPO,
	ROLES.SUBJEFE_GRUPO,
	ROLES.ADMINISTRADOR,
];
const ROLES_RAMA_PENDIENTES: RolesType[] = [
	ROLES.AYUDANTE_RAMA,
	ROLES.SUBJEFE_RAMA,
	ROLES.JEFE_RAMA,
];

const getEstadoObligacion = (montoEsperado: number, montoCondonado: number, montoImputado: number) => {
	const pendiente = Number((montoEsperado - montoCondonado - montoImputado).toFixed(2));
	if (pendiente <= 0) return "AL_DIA";
	if (montoImputado > 0 || montoCondonado > 0) return "INCOMPLETO";
	return "PENDIENTE";
};

const getMesFromPeriodo = (periodo: string) => {
	const partes = periodo.split("-");
	if (partes.length !== 2) return null;
	const mes = Number(partes[1]);
	return Number.isNaN(mes) ? null : mes;
};

export class ServicioObligacionesPago {
	obtenerCicloActivo = async () => {
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

		if (!ciclo) {
			throw new AppError({
				name: "REGLAS_PAGO_NO_CONFIGURADAS",
				httpCode: HttpCode.NOT_FOUND,
				description: "No hay un ciclo de reglas de pago activo",
			});
		}

		return ciclo;
	};

	generarObligacionesCiclo = async (cicloId: string, opts?: { forzarRecrear?: boolean }) => {
		const ciclo = await (prismaClient as any).cicloReglasPago.findUnique({
			where: { uuid: cicloId },
			include: {
				reglasAfiliacion: true,
				reglasCuotaMensual: true,
				reglaDescuentoPagoAnual: true,
				reglasDescuentoFamiliar: true,
			},
		});

		if (!ciclo) {
			throw new AppError({
				name: "REGLAS_NO_ENCONTRADAS",
				httpCode: HttpCode.NOT_FOUND,
				description: "No existe el ciclo de reglas solicitado",
			});
		}

		if (opts?.forzarRecrear) {
			// Borrado en secuencia respetando FK: condonaciones → imputaciones → obligaciones → saldos
			await (prismaClient as any).condonacionPago.deleteMany({
				where: { obligacion: { cicloId } },
			});
			await (prismaClient as any).imputacionPago.deleteMany({
				where: { obligacion: { cicloId } },
			});
			await (prismaClient as any).obligacionPago.deleteMany({ where: { cicloId } });
			await (prismaClient as any).saldoAFavor.deleteMany({ where: { cicloId } });
		}

		// Prefetch en paralelo
		const [scouts, { scoutToFamilia, familiaToScouts }, becasRaw] = await Promise.all([
			(prismaClient as any).scout.findMany({
				where: { estado: { not: "INACTIVO" } },
				select: { uuid: true, funcion: true, rama: true, primerCicloAfiliado: true },
			}),
			construirMapaFamilias(),
			(prismaClient as any).becaSAAC.findMany({
				where: { cicloId },
				select: { scoutId: true, porcentaje: true },
			}),
		]);

		const becaMap = new Map<string, number>(becasRaw.map((b: any) => [b.scoutId, b.porcentaje]));
		const exencionHabilitada = ciclo.exencionPrimerCicloHabilitada ?? false;

		const reglasAfiliacion = ciclo.reglasAfiliacion ?? [];
		const reglasCuota = (ciclo.reglasCuotaMensual ?? [])
			.filter((regla: any) => regla.cobrable)
			.sort((a: any, b: any) => a.mes - b.mes);
		const reglasFamilia = (ciclo.reglasDescuentoFamiliar ?? []).sort(
			(a: any, b: any) => a.cantidadMinima - b.cantidadMinima,
		);

		const mesInicioAfiliacion = new Date(ciclo.fechaInicio).getUTCMonth() + 1;
		const periodoAfiliacion = `${ciclo.anio}-${String(mesInicioAfiliacion).padStart(2, "0")}`;

		// ── Construir todas las obligaciones en memoria ────────────────────────
		const todasLasObligaciones: Array<{
			uuid: string;
			cicloId: string;
			tipo: string;
			periodo: string;
			scoutId: string;
			familiaClave: string;
			montoEsperado: number;
			estado: string;
			detalleCalculo: object;
		}> = [];

		for (const scout of scouts) {
			const familiaClave = scoutToFamilia.get(scout.uuid) ?? `familia::${scout.uuid}`;
			const integrantesFamilia = familiaToScouts.get(familiaClave) ?? [scout.uuid];
			const ordenScout = integrantesFamilia.sort().indexOf(scout.uuid) + 1;
			const reglaFamiliarAplicada = reglasFamilia.find((regla: any) => {
				const cumpleMin = ordenScout >= regla.cantidadMinima;
				const cumpleMax = regla.cantidadMaxima == null || ordenScout <= regla.cantidadMaxima;
				return cumpleMin && cumpleMax;
			});

			const reglaAfiliacion = reglasAfiliacion.find(
				(item: any) => item.funcionScout === scout.funcion && item.obligatoria,
			);
			const esPrimerCicloExento = exencionHabilitada && scout.funcion === "JOVEN" && scout.primerCicloAfiliado;
			if (reglaAfiliacion && !esPrimerCicloExento) {
				const porcentajeBeca = becaMap.get(scout.uuid);
				const montoEsperado = porcentajeBeca !== undefined
					? Number((reglaAfiliacion.monto * (1 - porcentajeBeca / 100)).toFixed(2))
					: reglaAfiliacion.monto;
				todasLasObligaciones.push({
					uuid: nanoid(10),
					cicloId,
					tipo: "AFILIACION",
					periodo: periodoAfiliacion,
					scoutId: scout.uuid,
					familiaClave,
					montoEsperado,
					estado: "PENDIENTE",
					detalleCalculo: {
						reglaAfiliacionId: reglaAfiliacion.uuid,
						funcionScout: scout.funcion,
						...(porcentajeBeca !== undefined ? { becaSAAC: { porcentaje: porcentajeBeca } } : {}),
					},
				});
			}

			if (scout.funcion === "JOVEN") {
				for (const reglaCuota of reglasCuota) {
					const periodo = `${ciclo.anio}-${String(reglaCuota.mes).padStart(2, "0")}`;
					const montoAplicado = reglaFamiliarAplicada?.montoPorScout ?? reglaCuota.montoBase;
					todasLasObligaciones.push({
						uuid: nanoid(10),
						cicloId,
						tipo: "CUOTA_MENSUAL",
						periodo,
						scoutId: scout.uuid,
						familiaClave,
						montoEsperado: montoAplicado,
						estado: "PENDIENTE",
						detalleCalculo: {
							reglaCuotaMensualId: reglaCuota.uuid,
							montoBase: reglaCuota.montoBase,
							integrantesFamilia: integrantesFamilia.length,
							ordenScout,
							reglaDescuentoFamiliarId: reglaFamiliarAplicada?.uuid ?? null,
							montoDescuentoFamiliar: reglaFamiliarAplicada?.montoPorScout ?? null,
							descuentoAnualConfig: ciclo.reglaDescuentoPagoAnual
								? {
									habilitado: ciclo.reglaDescuentoPagoAnual.habilitado,
									mesBonificado: ciclo.reglaDescuentoPagoAnual.mesBonificado,
								}
								: null,
						},
					});
				}
			}
		}

		// Prisma 7 eliminó skipDuplicates de createMany. No es necesario porque
		// todos los callers pasan forzarRecrear: true, que ya borra las obligaciones
		// existentes antes de llegar acá.
		await (prismaClient as any).obligacionPago.createMany({
			data: todasLasObligaciones,
		});

		// ── Actualizar montos de las existentes (si cambiaron las reglas) ───────
		// Para cada obligacion existente, actualizar familiaClave y montoEsperado.
		// Usamos updateMany agrupado por tipo+periodo+scout clave.
		// Como no hay updateMany con valores distintos por fila en Prisma+SQLite,
		// lo hacemos en paralelo (Promise.all) que es O(1) en latencia percibida.
		const existentes = await (prismaClient as any).obligacionPago.findMany({
			where: { cicloId, estado: { not: "AL_DIA" } },
			select: { uuid: true, tipo: true, periodo: true, scoutId: true },
		});

		if (existentes.length > 0) {
			const mapaObligacionNueva = new Map(
				todasLasObligaciones.map(o => [`${o.tipo}|${o.periodo}|${o.scoutId}`, o]),
			);
			const updates = existentes
				.map((ex: any) => {
					const nueva = mapaObligacionNueva.get(`${ex.tipo}|${ex.periodo}|${ex.scoutId}`);
					if (!nueva) return null;
					return (prismaClient as any).obligacionPago.update({
						where: { uuid: ex.uuid },
						data: { familiaClave: nueva.familiaClave, montoEsperado: nueva.montoEsperado },
					});
				})
				.filter(Boolean);
			if (updates.length > 0) await Promise.all(updates);
		}

		const obligaciones = await (prismaClient as any).obligacionPago.findMany({
			where: { cicloId },
			select: { uuid: true },
		});

		if (opts?.forzarRecrear) {
			const { ServicioImputacionPago } = await import("./servicioImputacionPago");
			const servicioImputacion = new ServicioImputacionPago();
			await servicioImputacion.reimputarPagosCiclo(cicloId);
		}

		return { cicloId, obligacionesGeneradas: obligaciones.length };
	};


	backfillDesdeCicloActivo = async () => {
		const ciclo = await this.obtenerCicloActivo();
		return this.generarObligacionesCiclo(ciclo.uuid, { forzarRecrear: true });
	};

	generarObligacionesParaScout = async (scoutId: string) => {
		let ciclo: any;
		try {
			ciclo = await this.obtenerCicloActivo();
		} catch {
			return;
		}

		const scout = await (prismaClient as any).scout.findUnique({
			where: { uuid: scoutId },
			select: { uuid: true, funcion: true, estado: true, primerCicloAfiliado: true },
		});
		if (!scout || scout.estado === "INACTIVO") return;

		const { scoutToFamilia } = await construirMapaFamilias();
		const familiaClave = scoutToFamilia.get(scoutId) ?? `familia::${scoutId}`;

		const reglasAfiliacion = ciclo.reglasAfiliacion ?? [];
		const reglasCuota = (ciclo.reglasCuotaMensual ?? [])
			.filter((r: any) => r.cobrable)
			.sort((a: any, b: any) => a.mes - b.mes);

		const mesInicioAfiliacion = new Date(ciclo.fechaInicio).getUTCMonth() + 1;
		const periodoAfiliacion = `${ciclo.anio}-${String(mesInicioAfiliacion).padStart(2, "0")}`;

		const exencionHabilitada = ciclo.exencionPrimerCicloHabilitada ?? false;
		const obligacionesACrear: Array<any> = [];

		const reglaAfiliacion = reglasAfiliacion.find(
			(r: any) => r.funcionScout === scout.funcion && r.obligatoria,
		);
		const esPrimerCicloExento = exencionHabilitada && scout.funcion === "JOVEN" && scout.primerCicloAfiliado;
		if (reglaAfiliacion && !esPrimerCicloExento) {
			const becaScout = await (prismaClient as any).becaSAAC.findFirst({
				where: { scoutId, cicloId: ciclo.uuid },
				select: { porcentaje: true },
			});
			const montoEsperado = becaScout
				? Number((reglaAfiliacion.monto * (1 - becaScout.porcentaje / 100)).toFixed(2))
				: reglaAfiliacion.monto;
			obligacionesACrear.push({
				uuid: nanoid(10),
				cicloId: ciclo.uuid,
				tipo: "AFILIACION",
				periodo: periodoAfiliacion,
				scoutId,
				familiaClave,
				montoEsperado,
				estado: "PENDIENTE",
				detalleCalculo: {
					reglaAfiliacionId: reglaAfiliacion.uuid,
					funcionScout: scout.funcion,
					generadoPostCiclo: true,
					...(becaScout ? { becaSAAC: { porcentaje: becaScout.porcentaje } } : {}),
				},
			});
		}

		if (scout.funcion === "JOVEN") {
			const mesActual = new Date().getMonth() + 1;
			for (const reglaCuota of reglasCuota.filter((r: any) => r.mes >= mesActual)) {
				obligacionesACrear.push({
					uuid: nanoid(10),
					cicloId: ciclo.uuid,
					tipo: "CUOTA_MENSUAL",
					periodo: `${ciclo.anio}-${String(reglaCuota.mes).padStart(2, "0")}`,
					scoutId,
					familiaClave,
					montoEsperado: reglaCuota.montoBase,
					estado: "PENDIENTE",
					detalleCalculo: {
						reglaCuotaMensualId: reglaCuota.uuid,
						montoBase: reglaCuota.montoBase,
						generadoPostCiclo: true,
					},
				});
			}
		}

		for (const obligacion of obligacionesACrear) {
			const existing = await (prismaClient as any).obligacionPago.findFirst({
				where: {
					cicloId: obligacion.cicloId,
					tipo: obligacion.tipo,
					periodo: obligacion.periodo,
					scoutId: obligacion.scoutId,
				},
				select: { uuid: true },
			});
			if (!existing) {
				await (prismaClient as any).obligacionPago.create({ data: obligacion });
			}
		}
	};

	recalcularEstadoObligacion = async (obligacionId: string, tx?: any) => {
		const client = tx ?? (prismaClient as any);
		const obligacion = await client.obligacionPago.findUnique({
			where: { uuid: obligacionId },
			include: {
				imputaciones: {
					select: { montoImputado: true },
				},
			},
		});

		if (!obligacion) return null;

		const montoImputado = (obligacion.imputaciones ?? []).reduce(
			(acc: number, item: any) => acc + item.montoImputado,
			0,
		);
		const estado = getEstadoObligacion(obligacion.montoEsperado, obligacion.montoCondonado, montoImputado);

		return client.obligacionPago.update({
			where: { uuid: obligacionId },
			data: { estado },
		});
	};

	private validarAccesoPendientes = async ({
		user,
		filters,
	}: {
		user: any;
		filters: any;
	}) => {
		const where: any = {};
		const scoutNombre = typeof filters.scoutNombre === "string"
			? filters.scoutNombre.trim()
			: "";
		const scoutNombreNorm = normalizeText(scoutNombre);
		const scoutNombreFiltro = scoutNombre
			? {
				OR: [
					{ nombreNormalizado: { contains: scoutNombreNorm } },
					{ apellidoNormalizado: { contains: scoutNombreNorm } },
				],
			}
			: null;

		if (filters.estado) {
			where.estado = filters.estado;
		} else if (!filters.incluirTodosEstados) {
			where.estado = { in: ["PENDIENTE", "INCOMPLETO"] };
		}

		if (filters.scoutId) {
			where.scoutId = filters.scoutId;
		}
		if (filters.familiaClave) {
			where.familiaClave = filters.familiaClave;
		}

		const role = user.role as RolesType;
		if (ROLES_GLOBALES_PENDIENTES.includes(role)) {
			if (filters.rama || scoutNombreFiltro) {
				where.scout = {
					...(filters.rama ? { rama: filters.rama as RamasType } : {}),
					...(scoutNombreFiltro ?? {}),
				};
			}
			return where;
		}

		if (ROLES_RAMA_PENDIENTES.includes(role)) {
			const rama = user.scout?.rama;
			if (!rama) {
				throw new AppError({
					name: "RAMA_NO_DEFINIDA",
					httpCode: HttpCode.FORBIDDEN,
					description: "El usuario de rama no tiene rama configurada",
				});
			}
			where.scout = {
				rama,
				...(scoutNombreFiltro ?? {}),
			};
			return where;
		}

		if (role === ROLES.PADRE_REPRESENTANTE) {
			const familiarId = user.familiar?.id;
			if (!familiarId) {
				throw new AppError({
					name: "FAMILIAR_NO_CONFIGURADO",
					httpCode: HttpCode.FORBIDDEN,
					description: "El usuario no tiene familiar asociado",
				});
			}
			const scoutIds = await obtenerScoutIdsPorFamiliar(familiarId);
			where.scoutId = { in: scoutIds.length > 0 ? scoutIds : ["__none__"] };
			if (scoutNombreFiltro) {
				where.scout = scoutNombreFiltro;
			}
			return where;
		}

		throw new AppError({
			name: "ROL_SIN_ACCESO",
			httpCode: HttpCode.FORBIDDEN,
			description: "Tu rol no tiene permisos para ver pagos pendientes",
		});
	};

	listarPendientes = async ({ user, filters }: { user: any; filters: any }) => {
		const where = await this.validarAccesoPendientes({ user, filters });
		const offsetRaw = Number(filters?.offset);
		const limitRaw = Number(filters?.limit);
		const skip = Number.isFinite(offsetRaw) && offsetRaw > 0 ? Math.floor(offsetRaw) : 0;
		const take = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : undefined;

		const now = new Date();
		const periodoActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

		const obligaciones = await (prismaClient as any).obligacionPago.findMany({
			where: { ...where, periodo: { lte: periodoActual } },
			skip,
			take,
			include: {
				scout: {
					select: {
						uuid: true,
						nombre: true,
						apellido: true,
						rama: true,
					},
				},
				imputaciones: {
					select: { montoImputado: true },
				},
				condonaciones: {
					select: {
						uuid: true,
						montoCondonado: true,
						motivo: true,
						fecha: true,
					},
				},
			},
			orderBy: [{ periodo: "asc" }, { tipo: "asc" }],
		});

		return obligaciones.map((item: any) => {
			const montoPagado = (item.imputaciones ?? []).reduce(
				(acc: number, imputacion: any) => acc + imputacion.montoImputado,
				0,
			);
			const montoPendiente = Number(
				(item.montoEsperado - item.montoCondonado - montoPagado).toFixed(2),
			);

			return {
				id: item.uuid,
				tipo: item.tipo,
				periodo: item.periodo,
				estado: item.estado,
				familiaClave: item.familiaClave,
				scout: item.scout
					? {
						id: item.scout.uuid,
						nombre: item.scout.nombre,
						apellido: item.scout.apellido,
						rama: item.scout.rama,
					}
					: null,
				montoEsperado: item.montoEsperado,
				montoPagado,
				montoCondonado: item.montoCondonado,
				montoPendiente,
				saldo: montoPendiente < 0 ? Math.abs(montoPendiente) : 0,
				cantidadCondonaciones: item.condonaciones?.length ?? 0,
			};
		});
	};

	obtenerPendiente = async ({ user, obligacionId }: { user: any; obligacionId: string }) => {
		const where = await this.validarAccesoPendientes({
			user,
			filters: { incluirTodosEstados: true },
		});

		const obligacion = await (prismaClient as any).obligacionPago.findFirst({
			where: {
				...where,
				uuid: obligacionId,
			},
			include: {
				scout: {
					select: {
						uuid: true,
						nombre: true,
						apellido: true,
						rama: true,
					},
				},
				imputaciones: {
					orderBy: { fecha: "asc" },
					include: {
						pago: {
							select: {
								uuid: true,
								fechaPago: true,
								concepto: true,
								monto: true,
							},
						},
					},
				},
				condonaciones: {
					orderBy: { fecha: "asc" },
					include: {
						condonadoPorUser: {
							select: { uuid: true, username: true },
						},
					},
				},
			},
		});

		if (!obligacion) return null;

		const montoPagado = (obligacion.imputaciones ?? []).reduce(
			(acc: number, imputacion: any) => acc + imputacion.montoImputado,
			0,
		);
		const montoPendiente = Number(
			(obligacion.montoEsperado - obligacion.montoCondonado - montoPagado).toFixed(2),
		);
		const mes = getMesFromPeriodo(obligacion.periodo);

		return {
			id: obligacion.uuid,
			tipo: obligacion.tipo,
			periodo: obligacion.periodo,
			mes,
			estado: obligacion.estado,
			familiaClave: obligacion.familiaClave,
			montoEsperado: obligacion.montoEsperado,
			montoPagado,
			montoCondonado: obligacion.montoCondonado,
			montoPendiente,
			detalleCalculo: obligacion.detalleCalculo,
			scout: obligacion.scout
				? {
					id: obligacion.scout.uuid,
					nombre: obligacion.scout.nombre,
					apellido: obligacion.scout.apellido,
					rama: obligacion.scout.rama,
				}
				: null,
			imputaciones: (obligacion.imputaciones ?? []).map((item: any) => ({
				id: item.uuid,
				montoImputado: item.montoImputado,
				fecha: item.fecha,
				pago: {
					id: item.pago.uuid,
					fechaPago: item.pago.fechaPago,
					concepto: item.pago.concepto,
					monto: item.pago.monto,
				},
			})),
			condonaciones: (obligacion.condonaciones ?? []).map((item: any) => ({
				id: item.uuid,
				montoCondonado: item.montoCondonado,
				motivo: item.motivo,
				fecha: item.fecha,
				condonadoPor: item.condonadoPorUser
					? {
						id: item.condonadoPorUser.uuid,
						username: item.condonadoPorUser.username,
					}
					: null,
			})),
		};
	};

	/**
	 * Versión sin RBAC para uso service-to-service (x-api-key).
	 * Devuelve las obligaciones PENDIENTE e INCOMPLETO de un scout específico.
	 */
	listarPendientesPorScout = async (scoutId: string) => {
		const now = new Date();
		const periodoActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

		const obligaciones = await (prismaClient as any).obligacionPago.findMany({
			where: {
				scoutId,
				estado: { in: ["PENDIENTE", "INCOMPLETO"] },
				periodo: { lte: periodoActual },
			},
			include: {
				scout: {
					select: { uuid: true, nombre: true, apellido: true, rama: true },
				},
				imputaciones: {
					select: { montoImputado: true },
				},
			},
			orderBy: [{ periodo: "asc" }, { tipo: "asc" }],
		});

		return obligaciones.map((item: any) => {
			const montoPagado = (item.imputaciones ?? []).reduce(
				(acc: number, imp: any) => acc + imp.montoImputado,
				0,
			);
			const montoPendiente = Number(
				(item.montoEsperado - item.montoCondonado - montoPagado).toFixed(2),
			);
			return {
				id: item.uuid,
				tipo: item.tipo,
				periodo: item.periodo,
				estado: item.estado,
				montoEsperado: item.montoEsperado,
				montoPagado,
				montoCondonado: item.montoCondonado,
				montoPendiente,
				scout: item.scout
					? { id: item.scout.uuid, nombre: item.scout.nombre, apellido: item.scout.apellido, rama: item.scout.rama }
					: null,
			};
		});
	};
}
