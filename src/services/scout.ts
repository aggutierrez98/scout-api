import {
	FuncionType,
	IScout,
	IScoutData,
	ProgresionType,
	RamasType,
	ScoutXLSX,
	SexoType,
} from "../types";
import { OrderToGetScouts } from "../types";
import { nanoid } from "nanoid";
import { AppError, getAge, HttpCode } from "../utils";
import { prismaClient } from "../utils/lib/prisma-client";
import fileUpload from "express-fileupload";
import { readXlsxBuffer } from "../utils/lib/exceljs";
import { Prisma } from "@prisma/client";
import logger from "../utils/classes/Logger";
import { mapXLSXScoutToScoutData } from "../utils/helpers/mapXLSXScoutToScoutData";

const prisma = prismaClient.$extends({
	result: {
		scout: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
			edad: {
				needs: { fechaNacimiento: true },
				compute(scout) {
					return getAge(scout.fechaNacimiento)
				},
			}
		},
		documentoPresentado: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
		},
		entregaRealizada: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
		},
		equipo: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
		},
		familiar: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
		},
	},
});

export const ScoutModel = prisma.scout;

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
		ramas?: RamasType[],
		existingUser?: string
	};
	select?: Prisma.ScoutSelect
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
	updateScout: (id: string, dataUpdated: IScout) => Promise<IScoutData | null>;
	deleteScout: (id: string) => Promise<IScoutData | null>;
}

export class ScoutService implements IScoutService {
	insertScout = async (scout: IScout) => {
		const uuid = nanoid(10);

		const responseInsert = await ScoutModel.create({
			data: {
				...scout,
				uuid,
				nombre: scout.nombre.toLocaleUpperCase(),
				apellido: scout.apellido.toLocaleUpperCase(),
				direccion: scout.direccion.toLocaleUpperCase(),
				localidad: scout.localidad.toLocaleUpperCase(),
				telefono: scout.telefono?.toLocaleUpperCase(),
				mail: scout.mail?.toLocaleUpperCase(),
				rama: scout.rama?.toLocaleUpperCase(),
			},
		});

		return responseInsert;
	};
	getScouts = async ({
		limit = 15,
		offset = 0,
		orderBy = "apellido",
		filters = {},
		select
	}: queryParams) => {
		const {
			funciones,
			progresiones,
			nombre = "",
			equipos,
			sexo,
			ramas,
			existingUser
		} = filters;

		const responseItem = await ScoutModel.findMany({
			skip: offset,
			take: limit,
			orderBy: { [orderBy]: "asc" },
			where: {
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
						nombre: {
							contains: nombre,
						},
					},
					{
						apellido: {
							contains: nombre,
						},
					},
				],
				user: existingUser
					? (existingUser === "true"
						? { isNot: null }
						: { is: null }
					) : undefined
			},
			select,
		});

		return responseItem;
	};

	getAllScouts = async () => {
		const response = await ScoutModel.findMany({
			orderBy: { apellido: "asc" },
			select: {
				id: true,
				uuid: true,
				apellido: true,
				nombre: true,
			},
			where: {
				// funcion: "JOVEN",
				user: {
					is: null
				}
			},
		});
		return response.map(({ id, apellido, nombre }) => ({ id: id, nombre: `${apellido} ${nombre}`.toLocaleUpperCase() }))
	}
	getAllEducadores = async () => {
		const response = await ScoutModel.findMany({
			orderBy: { apellido: "asc" },
			select: {
				id: true,
				uuid: true,
				apellido: true,
				nombre: true,
			},
			where: {
				funcion: {
					not: "JOVEN",
				},
				user: {
					is: null
				}
			},
		});
		return response.map(({ id, apellido, nombre }) => ({ id: id, nombre: `${apellido} ${nombre}`.toLocaleUpperCase() }))
	}

	getScout = async (id: string) => {
		try {
			const responseItem = await ScoutModel.findUnique({
				where: { uuid: id },
				include: {
					entregasObtenidas: {
						orderBy: {
							fechaEntrega: "desc",
						},
						select: {
							id: true,
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
							fechaPresentacion: true,
							documento: {
								select: {
									nombre: true,
									vence: true,
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
							nombre: true,
							lema: true,
						},
					},
				},
			});

			if (!responseItem) return null;

			const { documentosPresentados, familiarScout, ...rest } = responseItem;
			const response: IScoutData = { ...rest };

			response.documentosPresentados = documentosPresentados.map(
				({ documento, fechaPresentacion, id }) => ({
					...documento,
					fechaPresentacion,
					id,
				}),
			);
			response.familiares = familiarScout.map(({ familiar, relacion }) => ({
				...familiar,
				relacion,
			}));

			return response;
		} catch (error) {
			return null;
		}
	};
	updateScout = async (id: string, dataUpdated: IScout) => {
		const { direccion, localidad, funcion, mail, telefono, equipoId, religion, progresionActual, rama } = dataUpdated

		const responseItem = await ScoutModel.update({
			where: { uuid: id },
			data: { direccion, localidad, funcion, mail, telefono, equipoId, religion, progresionActual, rama },
		});
		return responseItem;
	};
	deleteScout = async (id: string) => {
		const responseItem = await ScoutModel.delete({ where: { uuid: id } });
		return responseItem;
	};

	importScouts = async (nomina: fileUpload.UploadedFile) => {
		const scoutsData = readXlsxBuffer(nomina.data) as Partial<ScoutXLSX>[]

		const scouts: Prisma.ScoutCreateManyInput[] = [];
		for (const scoutData of scoutsData) {
			const data = await mapXLSXScoutToScoutData(scoutData)
			const foundExisting = await prismaClient.scout.findFirst({
				where: { dni: data.dni }
			});

			if (!foundExisting) {
				scouts.push({
					...data,
					uuid: nanoid(10)
				});
			}
		}

		logger.debug(`-> Cargando ${scouts.length} scouts a la bd...`);

		try {
			const scoutsResult = await prismaClient.scout.createMany({
				data: scouts,
			});
			return {
				total: scouts.length,
				successful: scoutsResult.count,
			}
		} catch (error) {
			logger.error(error as string)
			throw new AppError({
				name: "BAD_FILE",
				httpCode: HttpCode.BAD_REQUEST,
				description: "El archivo enviado contiene valores no validos"
			})
		}
	}
}
