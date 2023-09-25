import { IPatrulla, IPatrullaData } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PatrullaModel = prisma.patrulla;

interface IPatrullaService {
	insertPatrulla: (patrulla: IPatrulla) => Promise<IPatrullaData | null>;
	getPatrullas: () => Promise<IPatrullaData[]>;
	getPatrulla: (id: string) => Promise<IPatrullaData | null>;
	updatePatrulla: (
		id: string,
		dataUpdated: IPatrulla,
	) => Promise<IPatrullaData | null>;
	deletePatrulla: (id: string) => Promise<IPatrullaData | null>;
}

export class PatrullaService implements IPatrullaService {
	insertPatrulla = async (patrulla: IPatrulla) => {
		const responseInsert = await PatrullaModel.create({
			data: patrulla,
		});
		return responseInsert;
	};
	getPatrullas = async () => {
		const responseItem = await PatrullaModel.findMany();
		return responseItem;
	};
	getPatrulla = async (id: string) => {
		try {
			const responseItem = await PatrullaModel.findUnique({
				where: { id: Number(id) },
			});

			return responseItem;
		} catch (error) {
			return null;
		}
	};
	updatePatrulla = async (id: string, dataUpdated: IPatrulla) => {
		const responseItem = await PatrullaModel.update({
			where: { id: Number(id) },
			data: dataUpdated,
		});
		return responseItem;
	};
	deletePatrulla = async (id: string) => {
		const responseItem = await PatrullaModel.delete({
			where: { id: Number(id) },
		});
		return responseItem;
	};
}
