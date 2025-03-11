import { nanoid } from "nanoid";
import { IFamiliar, IFamiliarScoutData, RelacionFamiliarType } from "../types";
import { getAge } from "../utils";
import { prismaClient } from "../utils/lib/prisma-client";
import { Prisma } from "@prisma/client";

const prisma = prismaClient.$extends({
	result: {
		familiar: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
			edad: {
				needs: { fechaNacimiento: true },
				compute(scout) {
					return getAge(scout.fechaNacimiento)
				},
			},
		},
		scout: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
			edad: {
				needs: { fechaNacimiento: true },
				compute(scout) {
					return getAge(scout.fechaNacimiento)
				},
			},
		},
		user: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
		}
	},
});
const FamiliarModel = prisma.familiar;
const FamiliarScoutModel = prisma.familiarScout;


interface queryParams {
	limit?: number;
	offset?: number;
	filters: {
		nombre?: string;
		scoutId?: string
		existingUser?: string
	};
	select?: Prisma.FamiliarSelect
}

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
	) => Promise<IFamiliarScoutData | null>;
	getFamiliar: (id: string) => Promise<IFamiliarScoutData | null>;
	updateFamiliar: (
		id: string,
		dataUpdated: IFamiliar,
	) => Promise<IFamiliarScoutData | null>;
	deleteFamiliar: (id: string) => Promise<IFamiliarScoutData | null>;
}

export class FamiliarService implements IFamiliarService {
	insertFamiliar = async (familiar: Omit<IFamiliar, "id">) => {
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
		const response = await FamiliarScoutModel.create({
			data: {
				scoutId: scoutId,
				familiarId: familiarId,
				relacion: relacionInput,
			},
			include: {
				familiar: {
					include: {
						padreScout: {
							include: {
								scout: {
									select: {
										id: true,
										uuid: true,
										nombre: true,
										apellido: true,
										fechaNacimiento: true,
										edad: true,
										sexo: true,
									},
								}
							}
						}
					}
				},
			},
		});

		const { familiar: { padreScout, ...data } } = response
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

		if (resp.count === 0) {
			return null;
		}

		const responseItem = await FamiliarModel.findUnique({
			where: { uuid: familiarId },
			include: {
				padreScout: {
					where: {
						familiarId,
					},
					include: {
						scout: {
							select: {
								id: true,
								uuid: true,
								nombre: true,
								apellido: true,
								fechaNacimiento: true,
								edad: true,
								sexo: true,
							},
						},
					},
				},
			},
		});

		if (!responseItem) return null

		const { padreScout, ...data } = responseItem;
		const scoutFamiliares = padreScout.map((scout) => ({ ...scout.scout, relacion: scout.relacion }));
		return { ...data, scoutFamiliares };
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
									uuid: true,
									nombre: true,
									apellido: true,
									fechaNacimiento: true,
									edad: true,
									sexo: true,
								},
							},
						},
					},
				},
			});

			if (responseItem) {
				const { padreScout, ...data } = responseItem;
				const scoutFamiliares = padreScout.map((scout) => ({ ...scout.scout, relacion: scout.relacion }));
				return { ...data, scoutFamiliares };
			}
			return null;
		} catch (error) {
			return null;
		}
	};

	getFamiliares = async ({ limit = 15, offset = 0, filters = {}, select }: queryParams) => {
		const {
			nombre = "",
			scoutId,
			existingUser
		} = filters;

		const responses = await FamiliarModel.findMany({
			skip: offset,
			take: limit,
			orderBy: { nombre: "asc" },
			where: {
				OR: [
					{
						padreScout: {
							some: {
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
										{
											uuid: {
												equals: scoutId,
											},
										},
									]
								}
							}
						}
					},
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
						]
					},

				],
				padreScout: {
					some: {
						scout: {
							uuid: {
								equals: scoutId,
							},
						}
					}
				},
				user: existingUser
					? (existingUser === "true"
						? { isNot: null }
						: { is: null }
					) : undefined
			},
			select
		});

		return responses;

	};

	updateFamiliar = async (id: string, dataUpdated: Omit<IFamiliar, "id">) => {
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
								uuid: true,
								nombre: true,
								apellido: true,
								fechaNacimiento: true,
								edad: true,
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
