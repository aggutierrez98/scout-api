import { nanoid } from "nanoid";
import { AppError, HttpCode } from "../utils";
import { prismaClient } from "../utils/lib/prisma-client";
import { ServicioObligacionesPago } from "./servicioObligacionesPago";

export class ServicioBecaSAAC {
	private servicioObligaciones = new ServicioObligacionesPago();

	listarPorCiclo = async (cicloId: string) => {
		const becas = await (prismaClient as any).becaSAAC.findMany({
			where: { cicloId },
			include: {
				scout: {
					select: { uuid: true, nombre: true, apellido: true, rama: true, funcion: true },
				},
				creadoPor: {
					select: { uuid: true, username: true },
				},
			},
			orderBy: [{ scout: { apellido: "asc" } }, { scout: { nombre: "asc" } }],
		});

		return becas.map((b: any) => ({
			id: b.uuid,
			porcentaje: b.porcentaje,
			motivo: b.motivo ?? null,
			fechaCreacion: b.fechaCreacion,
			scout: b.scout
				? { id: b.scout.uuid, nombre: b.scout.nombre, apellido: b.scout.apellido, rama: b.scout.rama, funcion: b.scout.funcion }
				: null,
			creadoPor: b.creadoPor ? { id: b.creadoPor.uuid, username: b.creadoPor.username } : null,
		}));
	};

	crear = async ({
		cicloId,
		scoutId,
		porcentaje,
		motivo,
		userId,
	}: {
		cicloId: string;
		scoutId: string;
		porcentaje: number;
		motivo?: string;
		userId: string;
	}) => {
		if (porcentaje <= 0 || porcentaje > 100) {
			throw new AppError({
				name: "PORCENTAJE_INVALIDO",
				httpCode: HttpCode.BAD_REQUEST,
				description: "El porcentaje debe estar entre 1 y 100",
			});
		}

		const [ciclo, scout, existing] = await Promise.all([
			(prismaClient as any).cicloReglasPago.findUnique({
				where: { uuid: cicloId },
				select: { uuid: true, activo: true },
			}),
			(prismaClient as any).scout.findUnique({ where: { uuid: scoutId }, select: { uuid: true } }),
			(prismaClient as any).becaSAAC.findFirst({ where: { scoutId, cicloId }, select: { uuid: true } }),
		]);

		if (!ciclo) {
			throw new AppError({ name: "CICLO_NO_ENCONTRADO", httpCode: HttpCode.NOT_FOUND, description: "Ciclo no encontrado" });
		}
		if (!scout) {
			throw new AppError({ name: "SCOUT_NO_ENCONTRADO", httpCode: HttpCode.NOT_FOUND, description: "Scout no encontrado" });
		}
		if (existing) {
			throw new AppError({
				name: "BECA_YA_EXISTE",
				httpCode: HttpCode.BAD_REQUEST,
				description: "El scout ya tiene una beca SAAC en este ciclo",
			});
		}

		const beca = await (prismaClient as any).becaSAAC.create({
			data: {
				uuid: nanoid(10),
				scoutId,
				cicloId,
				porcentaje,
				motivo: motivo ?? null,
				creadoPorId: userId,
			},
			include: {
				scout: { select: { uuid: true, nombre: true, apellido: true } },
			},
		});

		if (ciclo.activo) {
			await this.servicioObligaciones.generarObligacionesCiclo(cicloId, { forzarRecrear: true });
		}

		return {
			id: beca.uuid,
			porcentaje: beca.porcentaje,
			motivo: beca.motivo ?? null,
			fechaCreacion: beca.fechaCreacion,
			scout: beca.scout ? { id: beca.scout.uuid, nombre: beca.scout.nombre, apellido: beca.scout.apellido } : null,
		};
	};

	actualizar = async ({
		becaId,
		porcentaje,
		motivo,
	}: {
		becaId: string;
		porcentaje?: number;
		motivo?: string;
	}) => {
		if (porcentaje !== undefined && (porcentaje <= 0 || porcentaje > 100)) {
			throw new AppError({
				name: "PORCENTAJE_INVALIDO",
				httpCode: HttpCode.BAD_REQUEST,
				description: "El porcentaje debe estar entre 1 y 100",
			});
		}

		const beca = await (prismaClient as any).becaSAAC.findUnique({
			where: { uuid: becaId },
			select: {
				uuid: true,
				cicloId: true,
				ciclo: {
					select: { activo: true },
				},
			},
		});
		if (!beca) {
			throw new AppError({ name: "BECA_NO_ENCONTRADA", httpCode: HttpCode.NOT_FOUND, description: "Beca SAAC no encontrada" });
		}

		const updated = await (prismaClient as any).becaSAAC.update({
			where: { uuid: becaId },
			data: {
				...(porcentaje !== undefined ? { porcentaje } : {}),
				...(motivo !== undefined ? { motivo } : {}),
			},
		});

		if (beca.ciclo?.activo) {
			await this.servicioObligaciones.generarObligacionesCiclo(beca.cicloId, { forzarRecrear: true });
		}

		return { id: updated.uuid, porcentaje: updated.porcentaje, motivo: updated.motivo ?? null };
	};

	eliminar = async (becaId: string) => {
		const beca = await (prismaClient as any).becaSAAC.findUnique({
			where: { uuid: becaId },
			select: {
				uuid: true,
				cicloId: true,
				ciclo: {
					select: { activo: true },
				},
			},
		});
		if (!beca) {
			throw new AppError({ name: "BECA_NO_ENCONTRADA", httpCode: HttpCode.NOT_FOUND, description: "Beca SAAC no encontrada" });
		}

		await (prismaClient as any).becaSAAC.delete({ where: { uuid: becaId } });
		if (beca.ciclo?.activo) {
			await this.servicioObligaciones.generarObligacionesCiclo(beca.cicloId, { forzarRecrear: true });
		}
		return { id: becaId };
	};
}
