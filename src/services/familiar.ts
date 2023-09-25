import { nanoid } from "nanoid";
import { IFamiliar, IFamiliarScoutData, RelacionFamiliarType } from "../types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient().$extends({
	result: {
		familiar: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
		},
	},
});
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
		const uuid = nanoid(10);

		const familiarRespInsert = await FamiliarModel.create({
			data: {
				...familiar,
				uuid,
				nombre: familiar.nombre.toLocaleUpperCase(),
				apellido: familiar.apellido.toLocaleUpperCase(),
				telefono: familiar.telefono?.toLocaleUpperCase(),
			},
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
				scoutId: scoutId,
				familiarId: familiarId,
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
								familiarId: familiarId,
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
				familiarId: familiarId,
				scoutId: scoutId,
			},
		});
		return resp.count !== 0;
	};

	getFamiliar = async (id: string) => {
		try {
			const responseItem = await FamiliarModel.findUnique({
				where: { uuid: id },
				include: {
					padreScout: {
						where: {
							familiarId: id,
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
			where: { uuid: id },
			data: dataUpdated,
			include: {
				padreScout: {
					where: {
						familiarId: id,
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
			where: { uuid: id },
		});

		await FamiliarScoutModel.deleteMany({
			where: {
				familiarId: id,
			},
		});

		return responseItem;
	};
}
