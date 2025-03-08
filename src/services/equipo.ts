import { nanoid } from "nanoid";
import { IEquipo, IEquipoData } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";

const prisma = prismaClient.$extends({
	result: {
		equipo: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
		},
	},
});
const EquipoModel = prisma.equipo;

interface IEquipoService {
	insertEquipo: (equipo: IEquipo) => Promise<IEquipoData | null>;
	getEquipos: () => Promise<IEquipoData[]>;
	getEquipo: (id: string) => Promise<IEquipoData | null>;
	updateEquipo: (
		id: string,
		dataUpdated: IEquipo,
	) => Promise<IEquipoData | null>;
	deleteEquipo: (id: string) => Promise<IEquipoData | null>;
}

export class EquipoService implements IEquipoService {
	insertEquipo = async (equipo: IEquipo) => {
		const uuid = nanoid(10);

		const responseInsert = await EquipoModel.create({
			data: {
				...equipo,
				uuid,
				nombre: equipo.nombre.toLocaleUpperCase(),
				rama: equipo.rama.toLocaleUpperCase(),
				lema: equipo.lema?.toLocaleUpperCase(),
			},
		});
		return responseInsert;
	};
	getEquipos = async () => {
		const responseItem = await EquipoModel.findMany();
		return responseItem;
	};
	getEquipo = async (id: string) => {
		try {
			const responseItem = await EquipoModel.findUnique({
				where: { uuid: id },
			});

			return responseItem;
		} catch (error) {
			return null;
		}
	};
	updateEquipo = async (id: string, dataUpdated: IEquipo) => {
		const responseItem = await EquipoModel.update({
			where: { uuid: id },
			data: dataUpdated,
		});
		return responseItem;
	};
	deleteEquipo = async (id: string) => {
		const responseItem = await EquipoModel.delete({
			where: { uuid: id },
		});
		return responseItem;
	};
}
