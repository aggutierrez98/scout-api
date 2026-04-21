import { nanoid } from "nanoid";
import {
	FuncionType,
	IEntrega,
	IEntregaData,
	ProgresionType,
	RamasType,
	TipoEntregaType,
} from "../types";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapEntregaRealizada } from "../mappers/entrega";
import { mapPartialScout } from "../mappers/scout";
import { AppError, HttpCode } from "../utils/classes/AppError";

type queryParams = {
	limit?: number;
	offset?: number;
	filters?: {
		nombre?: string;
		scoutId?: string;
		tiempoDesde?: Date;
		tiempoHasta?: Date;
		tipoEntrega?: TipoEntregaType[];
		equipos?: string[];
		funciones?: FuncionType[];
		ramas?: RamasType[];
		progresiones?: ProgresionType[];
		familiarId?: string;
	};
};

interface IEntregaService {
	insertEntrega: (entrega: IEntrega) => Promise<IEntregaData | null>;
	insertEntregas: (entregas: IEntrega[]) => Promise<IEntregaData[]>;
	getEntregas: ({
		limit,
		offset,
		filters,
	}: queryParams) => Promise<IEntregaData[]>;
	getEntrega: (id: string) => Promise<IEntregaData | null>;
	updateEntrega: (
		id: string,
		dataUpdated: IEntrega,
	) => Promise<IEntregaData | null>;
	deleteEntrega: (id: string) => Promise<IEntregaData | null>;
}

const getProgresionDataFromEntregaType = (
	tipoEntrega: string,
): { rama: RamasType; progresion: ProgresionType } | null => {
	if (!tipoEntrega.startsWith("PROG_")) return null;

	const [, rama, ...progresionParts] = tipoEntrega.split("_");
	if (!rama || !progresionParts.length) return null;

	return {
		rama: rama as RamasType,
		progresion: progresionParts.join("_") as ProgresionType,
	};
};

export class EntregaService implements IEntregaService {
	insertEntrega = async (entrega: IEntrega) => {
		const progresionData = getProgresionDataFromEntregaType(
			entrega.tipoEntrega,
		);
		if (progresionData) {
			const scout = await prismaClient.scout.findUnique({
				where: { uuid: entrega.scoutId },
				select: { rama: true },
			});

			if (scout?.rama !== progresionData.rama) {
				throw new AppError({
					name: "BAD_PARAMETERS",
					httpCode: HttpCode.BAD_REQUEST,
					description: `La entrega ${entrega.tipoEntrega} no corresponde a la rama ${scout?.rama ?? "desconocida"}`,
				});
			}
		}

		const responseInsert = await prismaClient.entregaRealizada.create({
			data: {
				uuid: nanoid(10),
				...entrega,
			},
			include: {
				scout: {
					select: {
						id: true,
						uuid: true,
						nombre: true,
						apellido: true,
						dni: true,
						funcion: true,
						fechaNacimiento: true,
						sexo: true,
						telefono: true,
					},
				},
			},
		});

		if (progresionData) {
			await prismaClient.scout.update({
				where: {
					uuid: entrega.scoutId,
				},
				data: {
					progresionActual: progresionData.progresion,
				},
			});
		}

		const { scout, ...entregaData } = responseInsert;
		return {
			...mapEntregaRealizada(entregaData),
			scout: mapPartialScout(scout),
		} as any;
	};

	insertEntregas = async (entregas: IEntrega[]) => {
		const responseInserts = await prismaClient.$transaction(async (tx) => {
			const createdEntregas: IEntregaData[] = [];
			const scoutIds = [...new Set(entregas.map((entrega) => entrega.scoutId))];
			const scouts = await tx.scout.findMany({
				where: { uuid: { in: scoutIds } },
				select: { uuid: true, rama: true },
			});
			const scoutById = new Map(scouts.map((scout) => [scout.uuid, scout]));

			for (const entrega of entregas) {
				const progresionData = getProgresionDataFromEntregaType(
					entrega.tipoEntrega,
				);
				if (!progresionData) continue;

				const scout = scoutById.get(entrega.scoutId);
				if (!scout || scout.rama !== progresionData.rama) {
					throw new AppError({
						name: "BAD_PARAMETERS",
						httpCode: HttpCode.BAD_REQUEST,
						description: `La entrega ${entrega.tipoEntrega} no corresponde a la rama ${scout?.rama ?? "desconocida"}`,
					});
				}
			}

			for (const entrega of entregas) {
				const progresionData = getProgresionDataFromEntregaType(
					entrega.tipoEntrega,
				);
				const responseInsert = await tx.entregaRealizada.create({
					data: {
						uuid: nanoid(10),
						...entrega,
					},
					include: {
						scout: {
							select: {
								id: true,
								uuid: true,
								nombre: true,
								apellido: true,
								dni: true,
								funcion: true,
								fechaNacimiento: true,
								sexo: true,
								telefono: true,
							},
						},
					},
				});

				if (progresionData) {
					await tx.scout.update({
						where: {
							uuid: entrega.scoutId,
						},
						data: {
							progresionActual: progresionData.progresion,
						},
					});
				}

				const { scout, ...entregaData } = responseInsert;
				createdEntregas.push({
					...mapEntregaRealizada(entregaData),
					scout: mapPartialScout(scout),
				} as any);
			}

			return createdEntregas;
		});

		return responseInserts;
	};

	getEntregas = async ({
		limit = 15,
		offset = 0,
		filters = {},
	}: queryParams) => {
		const {
			nombre = "",
			scoutId,
			tipoEntrega,
			tiempoDesde,
			tiempoHasta,
			funciones,
			equipos,
			progresiones,
			ramas,
			familiarId,
		} = filters;

		const responseItem = await prismaClient.entregaRealizada.findMany({
			skip: offset,
			take: limit,
			orderBy: { fechaEntrega: "desc" },
			where: {
				tipoEntrega: {
					in: tipoEntrega,
				},
				fechaEntrega: {
					lte: tiempoHasta,
					gte: tiempoDesde,
				},
				scout: {
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
					uuid: scoutId,
					familiarScout: familiarId
						? { some: { familiarId } }
						: undefined,
				},
			},
			include: {
				scout: {
					select: {
						id: true,
						uuid: true,
						nombre: true,
						apellido: true,
						dni: true,
						funcion: true,
						sexo: true,
						fechaNacimiento: true,
					},
				},
			},
		});
		return responseItem.map((item) => {
			const { scout, ...entregaData } = item;
			return {
				...mapEntregaRealizada(entregaData),
				scout: mapPartialScout(scout),
			} as any;
		});
	};

	getEntrega = async (id: string) => {
		try {
			const responseItem = await prismaClient.entregaRealizada.findUnique({
				where: { uuid: id },
				include: {
					scout: {
						select: {
							id: true,
							uuid: true,
							nombre: true,
							apellido: true,
							dni: true,
							funcion: true,
							fechaNacimiento: true,
							sexo: true,
							telefono: true,
						},
					},
				},
			});

			if (!responseItem) return null;

			const { scout, ...entregaData } = responseItem;
			return {
				...mapEntregaRealizada(entregaData),
				scout: mapPartialScout(scout),
			} as any;
		} catch (error) {
			return null;
		}
	};

	updateEntrega = async (id: string, { scoutId, ...dataUpdated }: IEntrega) => {
		try {
			const responseItem = await prismaClient.entregaRealizada.update({
				where: { uuid: id },
				data: {
					...dataUpdated,
					scoutId,
				},
				include: {
					scout: {
						select: {
							id: true,
							uuid: true,
							nombre: true,
							apellido: true,
							dni: true,
							funcion: true,
							fechaNacimiento: true,
							sexo: true,
							telefono: true,
						},
					},
				},
			});

			const { scout, ...entregaData } = responseItem;
			return {
				...mapEntregaRealizada(entregaData),
				scout: mapPartialScout(scout),
			} as any;
		} catch (error) {
			return null;
		}
	};

	deleteEntrega = async (id: string): Promise<IEntregaData | null> => {
		try {
			const responseItem = await prismaClient.entregaRealizada.delete({
				where: { uuid: id },
				include: {
					scout: {
						select: {
							id: true,
							uuid: true,
							nombre: true,
							apellido: true,
							dni: true,
							funcion: true,
							fechaNacimiento: true,
							sexo: true,
							telefono: true,
						},
					},
				},
			});

			const { scout, ...entregaData } = responseItem;
			return {
				...mapEntregaRealizada(entregaData),
				scout: mapPartialScout(scout),
			} as any;
		} catch (error) {
			return null;
		}
	};
}
