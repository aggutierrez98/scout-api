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

const prisma = new PrismaClient();
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
		const responseInsert = await ScoutModel.create({
			data: scout,
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
			funcion,
			progresion,
			nombre: nombreQuery,
			patrulla,
			sexo,
			insignia,
		} = filters;
		const [nombre, apellido] = nombreQuery?.split(" ") || [];

		const responseItem = await ScoutModel.findMany({
			skip: offset,
			take: limit,
			orderBy: { [orderBy]: "asc" },
			where: {
				OR: [
					{
						nombre: {
							search: nombre,
						},
					},
					{
						apellido: {
							search: apellido,
						},
					},
					{
						patrulla: {
							id: patrulla ? Number(patrulla) : undefined,
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
				where: { id: Number(id) },
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
							familiar: {
								select: {
									id: true,
									nombre: true,
									apellido: true,
									dni: true,
									fechaNacimiento: true,
									sexo: true,
									telefono: true,
								},
							},
						},
						orderBy: {
							relacion: "asc",
						},
					},
				},
			});

			return responseItem;
		} catch (error) {
			return null;
		}
	};
	updateScout = async (id: string, dataUpdated: IScout) => {
		const responseItem = await ScoutModel.update({
			where: { id: Number(id) },
			data: dataUpdated,
		});
		return responseItem;
	};
	deleteScout = async (id: string) => {
		const responseItem = await ScoutModel.delete({ where: { id: Number(id) } });
		return responseItem;
	};
}
