import { nanoid } from "nanoid";
import { IEquipo, IEquipoData } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapEquipo } from "../mappers/equipo";

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

		const responseInsert = await prismaClient.equipo.create({
			data: {
				...equipo,
				uuid,
				nombre: equipo.nombre.toLocaleUpperCase(),
				rama: equipo.rama.toLocaleUpperCase(),
				lema: equipo.lema?.toLocaleUpperCase(),
			},
		});
		return mapEquipo(responseInsert);
	};
	getEquipos = async () => {
		const responseItem = await prismaClient.equipo.findMany();
		return responseItem.map(equipo => mapEquipo(equipo));
	};
	getEquipo = async (id: string) => {
		try {
			const responseItem = await prismaClient.equipo.findUnique({
				where: { uuid: id },
			});

			return responseItem ? mapEquipo(responseItem) : null;
		} catch (error) {
			return null;
		}
	};
	updateEquipo = async (id: string, dataUpdated: IEquipo) => {
		const responseItem = await prismaClient.equipo.update({
			where: { uuid: id },
			data: dataUpdated,
		});
		return mapEquipo(responseItem);
	};
	deleteEquipo = async (id: string) => {
		const responseItem = await prismaClient.equipo.delete({
			where: { uuid: id },
		});
		return mapEquipo(responseItem);
	};
}
