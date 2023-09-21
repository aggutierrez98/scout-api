import { IScout, IScoutData } from "../types";
import { PrismaClient, Scout } from "@prisma/client";
import { OrderToGetScouts } from "../types";

const prisma = new PrismaClient();
const ScoutModel = prisma.scout;

interface IScoutService {
	insertScout: (scout: IScout) => Promise<IScoutData | null>;
	getScouts: ({
		limit,
		offset,
		orderBy,
	}: {
		limit?: number;
		offset?: number;
		orderBy?: OrderToGetScouts;
	}) => Promise<IScoutData[]>;
	getScout: (id: string) => Promise<IScoutData | null>;
	updateScout: (id: string, dataUpdated: Scout) => Promise<IScoutData | null>;
	deleteScout: (id: string) => Promise<IScoutData | null>;
}

export class ScoutService implements IScoutService {
	insertScout = async (scout: IScout) => {
		const responseInsert = await ScoutModel.create({
			//@ts-ignore
			data: scout,
		});
		return responseInsert;
	};
	getScouts = async ({ limit = 10, offset = 0, orderBy = "apellido" }) => {
		const responseItem = await ScoutModel.findMany({
			skip: offset,
			take: limit,
			orderBy: { [orderBy]: "asc" },
		});
		return responseItem;
	};
	getScout = async (id: string) => {
		try {
			const responseItem = await ScoutModel.findUnique({
				where: { id: Number(id) },
			});

			return responseItem;
		} catch (error) {
			return null;
		}
	};
	updateScout = async (id: string, dataUpdated: Scout) => {
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
