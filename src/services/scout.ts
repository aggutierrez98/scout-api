import type {
	FuncionType,
	IScout,
	IScoutData,
	ProgresionType,
	RamasType,
	ScoutXLSX,
	SexoType,
} from "../types";
import type { OrderToGetScouts } from "../types";
import { nanoid } from "nanoid";
import { AppError, getAge, HttpCode, PROGRESIONES_POR_RAMA } from "../utils";
import { prismaClient } from "../utils/lib/prisma-client";
import type fileUpload from "express-fileupload";
import { readXlsxBuffer } from "../utils/lib/exceljs";
import type { Prisma } from "@prisma/client";
import logger from "../utils/classes/Logger";
import { mapXLSXScoutToScoutData } from "../utils/helpers/mapXLSXScoutToScoutData";
import { mapScout } from "../mappers/scout";
import { normalizeText } from "../utils/helpers/text";
import { ServicioObligacionesPago } from "./servicioObligacionesPago";

type queryParams = {
	limit?: number;
	offset?: number;
	orderBy?: OrderToGetScouts;
	filters?: {
		nombre?: string;
		sexo?: SexoType;
		equipos?: string[];
		progresiones?: ProgresionType[];
		funciones?: FuncionType[];
		ramas?: RamasType[];
		existingUser?: string;
		familiarId?: string;
		estado?: string;
	};
	select?: Prisma.ScoutSelect;
};

interface IScoutService {
	insertScout: (scout: IScout) => Promise<IScoutData | null>;
	getScouts: ({
		limit,
		offset,
		orderBy,
		filters,
	}: queryParams) => Promise<Partial<IScoutData>[]>;
	getScout: (id: string) => Promise<IScoutData | null>;
	updateScout: (
		id: string,
		dataUpdated: Partial<IScout>,
	) => Promise<IScoutData | null>;
	deleteScout: (id: string) => Promise<IScoutData | null>;
}

const isValidProgresionForRama = (
	rama?: RamasType | null,
	progresion?: ProgresionType | null,
) => {
	if (!progresion) return true;
	if (!rama) return false;
	if (!(rama in PROGRESIONES_POR_RAMA)) {
		return false;
	}

	const allowedProgresiones = (PROGRESIONES_POR_RAMA[rama] ??
		[]) as readonly ProgresionType[];
	return allowedProgresiones.includes(progresion);
};

export class ScoutService implements IScoutService {
	insertScout = async (scout: IScout) => {
		if (!isValidProgresionForRama(scout.rama, scout.progresionActual)) {
			throw new AppError({
				name: "BAD_PARAMETERS",
				httpCode: HttpCode.BAD_REQUEST,
				description: `La progresion ${scout.progresionActual} no corresponde a la rama ${scout.rama}`,
			});
		}

		const uuid = nanoid(10);

		const nombre = scout.nombre.toLocaleUpperCase();
		const apellido = scout.apellido.toLocaleUpperCase();
		const responseInsert = await prismaClient.scout.create({
			data: {
				...scout,
				uuid,
				nombre,
				apellido,
				nombreNormalizado: normalizeText(nombre),
				apellidoNormalizado: normalizeText(apellido),
				direccion: scout.direccion.toLocaleUpperCase(),
				localidad: scout.localidad.toLocaleUpperCase(),
				telefono: scout.telefono?.toLocaleUpperCase(),
				mail: scout.mail?.toLocaleUpperCase(),
				rama: scout.rama,
			},
		});

		new ServicioObligacionesPago().generarObligacionesParaScout(responseInsert.uuid).catch((err: Error) => {
			logger.warn(`[insertScout] No se pudieron generar obligaciones para ${responseInsert.uuid}: ${err.message}`);
		});

		return mapScout(responseInsert);
	};
	getScouts = async ({
		limit = 15,
		offset = 0,
		orderBy = "apellido",
		filters = {},
		select,
	}: queryParams) => {
		const {
			funciones,
			progresiones,
			nombre = "",
			equipos,
			sexo,
			ramas,
			existingUser,
			familiarId,
			estado,
		} = filters;

		const nombreNorm = normalizeText(nombre);
		const responseItem = await prismaClient.scout.findMany({
			skip: offset,
			take: limit || undefined, // Si el limite === 0  →  no hay limite y se buscan todos
			orderBy: { [orderBy]: "asc" },
			where: {
				estado: estado || undefined,
				sexo: sexo || undefined,
				equipo: {
					uuid: equipos ? { in: equipos } : undefined,
				},
				progresionActual: {
					in: progresiones,
				},
				funcion: {
					in: funciones,
				},
				rama: {
					in: ramas,
				},
				OR: [
					{
						nombreNormalizado: {
							contains: nombreNorm,
						},
					},
					{
						apellidoNormalizado: {
							contains: nombreNorm,
						},
					},
				],
				user: existingUser
					? existingUser === "true"
						? { isNot: null }
						: { is: null }
					: undefined,
				familiarScout: familiarId
					? {
							some: {
								familiarId,
							},
						}
					: {},
			},
			select,
		});

		return responseItem.map((scout) => mapScout(scout));
	};

	getScout = async (id: string) => {
		try {
			const responseItem = await prismaClient.scout.findUnique({
				where: { uuid: id },
				include: {
					entregasObtenidas: {
						orderBy: {
							fechaEntrega: "desc",
						},
						select: {
							id: true,
							uuid: true,
							fechaEntrega: true,
							tipoEntrega: true,
						},
					},
					documentosPresentados: {
						orderBy: {
							fechaPresentacion: "desc",
						},
						select: {
							id: true,
							uuid: true,
							fechaPresentacion: true,
							documento: {
								select: {
									nombre: true,
									requiereRenovacionAnual: true,
								},
							},
						},
					},
					familiarScout: {
						select: {
							relacion: true,
							familiar: true,
						},
						orderBy: {
							relacion: "asc",
						},
					},
					equipo: {
						select: {
							id: true,
							uuid: true,
							nombre: true,
							lema: true,
						},
					},
				},
			});

			if (!responseItem) return null;

			const {
				documentosPresentados,
				familiarScout,
				entregasObtenidas,
				equipo,
				...rest
			} = responseItem;
			const response: IScoutData = mapScout(rest) as IScoutData;

			response.documentosPresentados = documentosPresentados.map(
				({ documento, fechaPresentacion, uuid }) => ({
					...documento,
					fechaPresentacion,
					id: uuid,
				}),
			);
			response.familiares = familiarScout.map(({ familiar, relacion }) => ({
				...familiar,
				id: familiar.uuid,
				edad: getAge(familiar.fechaNacimiento),
				relacion,
			}));
			response.entregasObtenidas = entregasObtenidas.map((entrega) => ({
				...entrega,
				id: entrega.uuid,
			}));
			response.equipo = equipo
				? {
						...equipo,
						id: equipo.uuid,
					}
				: null;

			return response;
		} catch (_error) {
			return null;
		}
	};
	updateScout = async (id: string, dataUpdated: Partial<IScout>) => {
		const {
			direccion,
			localidad,
			mail,
			telefono,
			equipoId,
			religion,
			progresionActual,
			rama,
			funcion,
			estado,
		} = dataUpdated;

		const currentScout = await prismaClient.scout.findUnique({
			where: { uuid: id },
			select: { rama: true, progresionActual: true },
		});

		if (!currentScout) {
			throw new AppError({
				name: "NOT_FOUND",
				httpCode: HttpCode.NOT_FOUND,
			});
		}

		const nextRama = (rama ?? currentScout.rama) as RamasType | null;
		const nextProgresion = (progresionActual ??
			currentScout.progresionActual) as ProgresionType | null;

		if (!isValidProgresionForRama(nextRama, nextProgresion)) {
			throw new AppError({
				name: "BAD_PARAMETERS",
				httpCode: HttpCode.BAD_REQUEST,
				description: `La progresion ${nextProgresion} no corresponde a la rama ${nextRama}`,
			});
		}

		const responseItem = await prismaClient.scout.update({
			where: { uuid: id },
			data: {
				direccion,
				localidad,
				mail,
				telefono,
				equipoId,
				religion,
				progresionActual,
				rama,
				funcion,
				estado,
			},
		});
		return mapScout(responseItem);
	};
	deleteScout = async (id: string) => {
		const responseItem = await prismaClient.scout.delete({
			where: { uuid: id },
		});
		return mapScout(responseItem);
	};

	findByDni = async (dni: string) => {
		const responseItem = await prismaClient.scout.findFirst({
			where: { dni },
		});
		if (!responseItem) return null;
		return mapScout(responseItem);
	};

	importScouts = async (nomina: fileUpload.UploadedFile) => {
		const scoutsData = readXlsxBuffer(nomina.data) as Partial<ScoutXLSX>[];

		// DNIs presentes en el archivo (raw), para determinar quién NO está en la nómina
		const nominaDnis = new Set(
			scoutsData
				.map((row) => (row.Documento ? String(row.Documento).trim() : null))
				.filter(Boolean) as string[],
		);

		const result: import("../types").ImportScoutsResult = {
			total: scoutsData.length,
			successful: 0,
			creados: [],
			conflictos: [],
			errores: [],
			desafiliados: [],
		};

		for (let i = 0; i < scoutsData.length; i++) {
			// La fila 1 del archivo es el encabezado, los datos empiezan en fila 2.
			const fila = i + 2;
			const scoutData = scoutsData[i];

			try {
				const data = await mapXLSXScoutToScoutData(scoutData);

				const existing = await prismaClient.scout.findFirst({
					where: { dni: data.dni },
					select: { nombre: true, apellido: true, dni: true, rama: true, funcion: true },
				});

				if (existing) {
					result.conflictos.push({
						fila,
						enArchivo: {
							nombre: data.nombre,
							apellido: data.apellido,
							dni: data.dni,
							rama: data.rama ?? undefined,
							funcion: data.funcion ?? undefined,
						},
						enSistema: {
							nombre: existing.nombre,
							apellido: existing.apellido,
							dni: existing.dni,
							rama: existing.rama,
							funcion: existing.funcion,
						},
					});
					continue;
				}

				const scoutCreado = await prismaClient.scout.create({
					data: {
						...data,
						uuid: nanoid(10),
						nombreNormalizado: normalizeText(data.nombre),
						apellidoNormalizado: normalizeText(data.apellido),
					},
				});

				new ServicioObligacionesPago().generarObligacionesParaScout(scoutCreado.uuid).catch((err: Error) => {
					logger.warn(`[importScouts] No se pudieron generar obligaciones para ${scoutCreado.uuid}: ${err.message}`);
				});

				result.creados.push({
					fila,
					nombre: data.nombre,
					apellido: data.apellido,
					dni: data.dni,
					rama: data.rama ?? undefined,
					funcion: data.funcion ?? undefined,
				});
				result.successful++;
			} catch (err) {
				logger.error(`[importScouts] Error en fila ${fila}: ${(err as Error).message}`);
				result.errores.push({
					fila,
					nombreRaw: scoutData.Nombre,
					dniRaw: scoutData.Documento ? String(scoutData.Documento) : undefined,
					motivo: (err as Error).message,
				});
			}
		}

		// Scouts activos que NO están en la nómina → marcar como no afiliados
		if (nominaDnis.size > 0) {
			const aDesafiliar = await prismaClient.scout.findMany({
				where: {
					estado: "ACTIVO",
					afiliado: { not: false },
					dni: { notIn: Array.from(nominaDnis) },
				},
				select: { nombre: true, apellido: true, dni: true, rama: true, funcion: true },
			});

			if (aDesafiliar.length > 0) {
				await prismaClient.scout.updateMany({
					where: {
						estado: "ACTIVO",
						afiliado: { not: false },
						dni: { notIn: Array.from(nominaDnis) },
					},
					data: { afiliado: false },
				});
				result.desafiliados = aDesafiliar;
			}
		}

		logger.debug(
			`[importScouts] total=${result.total} creados=${result.successful} conflictos=${result.conflictos.length} errores=${result.errores.length} desafiliados=${result.desafiliados.length}`,
		);
		return result;
	};
}
