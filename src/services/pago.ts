import { nanoid } from "nanoid";
import { FuncionType, IPago, IPagoData, MetodosPagoType, ProgresionType, RamasType } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapPago } from "../mappers/pago";
import { mapPartialScout } from "../mappers/scout";

type queryParams = {
	limit?: number;
	offset?: number;
	filters?: {
		nombre?: string;
		scoutId?: string
		tiempoDesde?: Date;
		tiempoHasta?: Date;
		concepto?: string;
		rendido?: string;
		metodoPago?: MetodosPagoType
		funcion?: FuncionType[];
		ramas?: RamasType[];
		equipos?: string[];
		funciones?: FuncionType[];
		progresiones?: ProgresionType[]
	};
};

interface IPagoService {
	insertPago: (pago: IPago) => Promise<IPagoData | null>;
	getPagos: ({ limit, offset, filters }: queryParams) => Promise<IPagoData[]>;
	getPago: (id: string) => Promise<IPagoData | null>;
	updatePago: (id: string, dataUpdated: IPago) => Promise<IPagoData | null>;
	deletePago: (id: string) => Promise<IPagoData | null>;
}

export class PagoService implements IPagoService {
	insertPago = async (pago: IPago) => {
		const responseInsert = await prismaClient.pago.create({
			data: {
				...pago,
				uuid: nanoid(10),
				concepto: pago.concepto.toLocaleUpperCase(),
				scoutId: pago.scoutId,
			},
		});
		return mapPago(responseInsert) as any;
	};

	getPagos = async ({ limit = 15, offset = 0, filters = {} }: queryParams) => {
		const {
			nombre = "",
			concepto = "",
			scoutId,
			equipos,
			metodoPago,
			rendido,
			tiempoDesde,
			tiempoHasta,
			funciones,
			progresiones,
			ramas
		} = filters;

		const responseItem = await prismaClient.pago.findMany({
			skip: offset,
			take: limit,
			orderBy: { fechaPago: "desc" },
			where: {
				metodoPago: metodoPago || undefined,
				scout: {
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
					uuid: scoutId
				},
				rendido: rendido ? rendido === "true" ? true : false : undefined,
				fechaPago: {
					lte: tiempoHasta,
					gte: tiempoDesde,
				},
				OR: [
					{
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
						}
					},
					{
						concepto: {
							contains: concepto,
						},
					}
				],
			},
		});
		return responseItem.map(pago => mapPago(pago));
	}; getPago = async (id: string) => {
		try {
			const responseItem = await prismaClient.pago.findUnique({
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

			const { scout, ...pago } = responseItem;
			return {
				...mapPago(pago),
				scout: mapPartialScout(scout)
			} as any;
		} catch (error) {
			return null;
		}
	};

	updatePago = async (id: string, { scoutId, ...dataUpdated }: IPago) => {
		const responseItem = await prismaClient.pago.update({
			where: { uuid: id },
			data: {
				...dataUpdated,
				scoutId: scoutId,
			},
		});

		return mapPago(responseItem) as any;
	};

	deletePago = async (id: string) => {
		const responseItem = await prismaClient.pago.delete({ where: { uuid: id } });
		return mapPago(responseItem) as any;
	};
}
