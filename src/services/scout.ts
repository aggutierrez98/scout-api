import {
	FuncionType,
	IScout,
	IScoutData,
	ProgresionType,
	SexoType,
} from "../types";
import { PrismaClient } from "@prisma/client";
import { OrderToGetScouts } from "../types";
import { nanoid } from "nanoid";
import { getAge } from "../utils";

const prisma = new PrismaClient().$extends({
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
		patrulla: {
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
		patrullas?: string[];
		progresiones?: ProgresionType[];
		funciones?: FuncionType[];
	};
};

interface IScoutService {
	insertScout: (scout: IScout) => Promise<IScoutData | null>;
	getScouts: ({
		limit,
		offset,
		orderBy,
		filters,
	}: queryParams) => Promise<IScoutData[]>;
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
			},
		});

		return responseInsert;
	};
	getScouts = async ({
		limit = 15,
		offset = 0,
		orderBy = "apellido",
		filters = {},
	}: queryParams) => {
		const {
			funciones,
			progresiones,
			nombre = "",
			patrullas,
			sexo,
		} = filters;

		const responseItem = await ScoutModel.findMany({
			skip: offset,
			take: limit,
			orderBy: { [orderBy]: "asc" },
			where: {
				sexo: sexo || undefined,
				patrulla: {
					uuid: patrullas ? { in: patrullas } : undefined,
				},
				progresionActual: {
					in: progresiones,
				},
				funcion: {
					in: funciones,
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
			},
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
				funcion: "JOVEN",
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
					patrulla: {
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
		const { direccion, localidad, funcion, mail, telefono, patrullaId, religion, progresionActual } = dataUpdated

		const responseItem = await ScoutModel.update({
			where: { uuid: id },
			data: { direccion, localidad, funcion, mail, telefono, patrullaId, religion, progresionActual },
		});
		return responseItem;
	};
	deleteScout = async (id: string) => {
		const responseItem = await ScoutModel.delete({ where: { uuid: id } });
		return responseItem;
	};
}
