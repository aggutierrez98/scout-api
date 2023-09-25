import {
	FuncionType,
	IScout,
	IScoutData,
	ProgresionType,
	SexoType,
	TipoInsigniaType,
} from "../types";
import { PrismaClient } from "@prisma/client";
import { OrderToGetScouts } from "../types";
import { nanoid } from "nanoid";

const prisma = new PrismaClient().$extends({
	result: {
		scout: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
		},
		documentoPresentado: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
		},
		insigniaObtenida: {
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

const ScoutModel = prisma.scout;

type queryParams = {
	limit?: number;
	offset?: number;
	orderBy?: OrderToGetScouts;
	filters?: {
		nombre?: string;
		patrulla?: string;
		sexo?: SexoType[];
		insignia?: TipoInsigniaType[];
		funcion?: FuncionType[];
		progresion?: ProgresionType[];
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
		limit = 10,
		offset = 0,
		orderBy = "apellido",
		filters = {},
	}: queryParams) => {
		const {
			funcion = [],
			progresion = [],
			nombre = "",
			patrulla = "",
			sexo = [],
			insignia = [],
		} = filters;

		const responseItem = await ScoutModel.findMany({
			skip: offset,
			take: limit,
			orderBy: { [orderBy]: "asc" },
			where: {
				OR: [
					{
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
					{
						patrulla: {
							uuid: patrulla,
						},
					},
					{
						funcion: {
							in: funcion,
						},
					},
					{
						progresionActual: {
							in: progresion,
						},
					},
					{
						sexo: { in: sexo },
					},
					{
						insigniasObtenidas: {
							some: {
								insignia: { in: insignia },
							},
						},
					},
				],
			},
		});

		return responseItem;
	};
	getScout = async (id: string) => {
		try {
			const responseItem = await ScoutModel.findUnique({
				where: { uuid: id },
				include: {
					insigniasObtenidas: {
						orderBy: {
							fechaObtencion: "desc",
						},
						select: {
							id: true,
							insignia: true,
							progresion: true,
							fechaObtencion: true,
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
		const responseItem = await ScoutModel.update({
			where: { uuid: id },
			data: dataUpdated,
		});
		return responseItem;
	};
	deleteScout = async (id: string) => {
		const responseItem = await ScoutModel.delete({ where: { uuid: id } });
		return responseItem;
	};
}
