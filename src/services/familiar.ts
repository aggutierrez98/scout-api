import { IFamiliar, IFamiliarScoutData, RelacionFamiliarType } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FamiliarModel = prisma.familiar;
const FamiliarScoutModel = prisma.familiarScout;

interface IFamiliarService {
	insertFamiliar: (familiar: IFamiliar) => Promise<IFamiliarScoutData | null>;
	relateScoutToFamiliar: (
		familiarId: string,
		scoutId: string,
		relacion: RelacionFamiliarType,
	) => Promise<IFamiliarScoutData | null>;
	unrelateScoutToFamiliar: (
		familiarId: string,
		scoutId: string,
	) => Promise<true | false>;
	getFamiliar: (id: string) => Promise<IFamiliarScoutData | null>;
	updateFamiliar: (
		id: string,
		dataUpdated: IFamiliar,
	) => Promise<IFamiliarScoutData | null>;
	deleteFamiliar: (id: string) => Promise<IFamiliarScoutData | null>;
}

export class FamiliarService implements IFamiliarService {
	insertFamiliar = async (familiar: IFamiliar) => {
		const familiarRespInsert = await FamiliarModel.create({
			data: familiar,
		});
		return familiarRespInsert;
	};

	relateScoutToFamiliar = async (
		familiarId: string,
		scoutId: string,
		relacionInput: RelacionFamiliarType,
	) => {
		const {
			familiar: { padreScout, ...data },
		} = await FamiliarScoutModel.create({
			data: {
				scoutId: Number(scoutId),
				familiarId: Number(familiarId),
				relacion: relacionInput,
			},
			include: {
				familiar: {
					select: {
						id: true,
						nombre: true,
						apellido: true,
						dni: true,
						sexo: true,
						telefono: true,
						fechaNacimiento: true,
						padreScout: {
							where: {
								familiarId: Number(familiarId),
							},
							include: {
								scout: {
									select: {
										id: true,
										nombre: true,
										apellido: true,
										dni: true,
										fechaNacimiento: true,
										sexo: true,
									},
								},
							},
						},
					},
				},
			},
		});

		const scoutFamiliares = padreScout.map((scout) => scout.scout);
		return { ...data, scoutFamiliares };
	};

	unrelateScoutToFamiliar = async (familiarId: string, scoutId: string) => {
		const resp = await FamiliarScoutModel.deleteMany({
			where: {
				familiarId: Number(familiarId),
				scoutId: Number(scoutId),
			},
		});
		return resp.count !== 0;
	};

	getFamiliar = async (id: string) => {
		try {
			const responseItem = await FamiliarModel.findUnique({
				where: { id: Number(id) },
				include: {
					padreScout: {
						where: {
							familiarId: Number(id),
						},
						include: {
							scout: {
								select: {
									id: true,
									nombre: true,
									apellido: true,
									dni: true,
									fechaNacimiento: true,
									sexo: true,
								},
							},
						},
					},
				},
			});

			if (responseItem) {
				const { padreScout, ...data } = responseItem;
				const scoutFamiliares = padreScout.map((scout) => scout.scout);
				return { ...data, scoutFamiliares };
			}
			return null;
		} catch (error) {
			return null;
		}
	};

	updateFamiliar = async (id: string, dataUpdated: IFamiliar) => {
		const { padreScout, ...data } = await FamiliarModel.update({
			where: { id: Number(id) },
			data: dataUpdated,
			include: {
				padreScout: {
					where: {
						familiarId: Number(id),
					},
					include: {
						scout: {
							select: {
								id: true,
								nombre: true,
								apellido: true,
								dni: true,
								fechaNacimiento: true,
								sexo: true,
							},
						},
					},
				},
			},
		});
		const scoutFamiliares = padreScout.map((scout) => scout.scout);
		return { ...data, scoutFamiliares };
	};

	deleteFamiliar = async (id: string) => {
		const responseItem = await FamiliarModel.delete({
			where: { id: Number(id) },
		});

		await FamiliarScoutModel.deleteMany({
			where: {
				familiarId: Number(id),
			},
		});

		return responseItem;
	};
}
