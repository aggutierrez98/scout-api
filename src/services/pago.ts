import { nanoid } from "nanoid";
import { FuncionType, IPago, IPagoData } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient().$extends({
	result: {
		pago: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
		},
		scout: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
		},
	},
});
const PagoModel = prisma.pago;

type queryParams = {
	limit?: number;
	offset?: number;
	filters?: {
		tiempoDesde?: Date;
		tiempoHasta?: Date;
		nombre?: string;
		concepto?: string;
		patrulla?: string;
		funcion?: FuncionType[];
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
		const responseInsert = await PagoModel.create({
			data: {
				...pago,
				uuid: nanoid(10),
				concepto: pago.concepto.toLocaleUpperCase(),
				scoutId: pago.scoutId,
			},
		});
		return responseInsert;
	};

	getPagos = async ({ limit = 10, offset = 0, filters = {} }: queryParams) => {
		const {
			tiempoDesde,
			tiempoHasta,
			nombre = "",
			concepto = "",
			patrulla = "",
			funcion = [],
		} = filters;

		const responseItem = await PagoModel.findMany({
			skip: offset,
			take: limit,
			orderBy: { fechaPago: "desc" },
			where: {
				OR: [
					{
						scout: {
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
							],
						},
					},
					{
						concepto: {
							search: concepto,
						},
					},
					{
						fechaPago: {
							lte: tiempoHasta,
							gte: tiempoDesde,
						},
					},
				],
			},
		});
		return responseItem;
	};

	getPago = async (id: string) => {
		try {
			const responseItem = await PagoModel.findUnique({
				where: { uuid: id },
				include: {
					scout: {
						select: {
							id: true,
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

			return responseItem;
		} catch (error) {
			return null;
		}
	};

	updatePago = async (id: string, { scoutId, ...dataUpdated }: IPago) => {
		const responseItem = await PagoModel.update({
			where: { uuid: id },
			data: {
				...dataUpdated,
				scoutId: scoutId,
			},
		});

		return responseItem;
	};

	deletePago = async (id: string) => {
		const responseItem = await PagoModel.delete({ where: { uuid: id } });
		return responseItem;
	};
}
