import { IScout, IScoutData } from "../interfaces/scout.interface";
import { PrismaClient, Scout } from "@prisma/client";
import { OrderToGetScouts } from "../interfaces/types";

const prisma = new PrismaClient();
const ScoutModel = prisma.scout;

const insertScout = async (scout: IScout): Promise<IScoutData | null> => {
	const responseInsert = await ScoutModel.create({
		data: scout,
	});
	return responseInsert;
};

const getScouts = async ({
	limit = 10,
	offset = 0,
	orderBy = "apellido",
}: {
	limit?: number;
	offset?: number;
	orderBy?: OrderToGetScouts;
}): Promise<IScoutData[]> => {
	const responseItem = await ScoutModel.findMany({
		skip: offset,
		take: limit,
		orderBy: { [orderBy]: "asc" },
	});
	return responseItem;
};

const getScout = async (id: string): Promise<IScoutData | null> => {
	try {
		const responseItem = await ScoutModel.findUnique({
			where: { id: Number(id) },
		});

		return responseItem;
	} catch (error) {
		return null;
	}
};

const updateScout = async (
	id: string,
	dataUpdated: Scout,
): Promise<IScoutData | null> => {
	const responseItem = await ScoutModel.update({
		where: { id: Number(id) },
		data: dataUpdated,
	});
	return responseItem;
};

const deleteScout = async (id: string): Promise<IScoutData | null> => {
	const responseItem = await ScoutModel.delete({ where: { id: Number(id) } });
	return responseItem;
};

export { insertScout, getScouts, getScout, updateScout, deleteScout };
