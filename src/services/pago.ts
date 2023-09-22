import { FuncionType, IPago, IPagoData } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
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
			//@ts-ignore
			data: pago,
		});
		return responseInsert;
	};
	getPagos = async ({ limit = 10, offset = 0, filters = {} }: queryParams) => {
		const {
			tiempoDesde,
			tiempoHasta,
			nombre: nombreQuery,
			concepto,
			patrulla,
			funcion,
		} = filters;
		const [nombre, apellido] = nombreQuery?.split(" ") || [];

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
				where: { id: Number(id) },
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
	updatePago = async (id: string, dataUpdated: IPago) => {
		const responseItem = await PagoModel.update({
			where: { id: Number(id) },
			//@ts-ignore
			data: dataUpdated,
		});
		return responseItem;
	};
	deletePago = async (id: string) => {
		const responseItem = await PagoModel.delete({ where: { id: Number(id) } });
		return responseItem;
	};
}
