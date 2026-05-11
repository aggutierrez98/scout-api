import { nanoid } from "nanoid";
import { IFamiliar, IFamiliarScoutData, RelacionFamiliarType, RamasType } from "../types";
import { Prisma } from "@prisma/client";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapFamiliar } from "../mappers/familiar";
import { mapPartialScout } from "../mappers/scout";
import { normalizeText } from "../utils/helpers/text";

interface queryParams {
	limit?: number;
	offset?: number;
	filters: {
		nombre?: string;
		scoutId?: string
		existingUser?: string
		ramaFilter?: RamasType
		familiarUuid?: string
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

		const nombre = familiar.nombre.toLocaleUpperCase();
		const apellido = familiar.apellido.toLocaleUpperCase();
		const familiarRespInsert = await prismaClient.familiar.create({
			data: {
				...familiar,
				uuid,
				nombre,
				apellido,
				nombreNormalizado: normalizeText(nombre),
				apellidoNormalizado: normalizeText(apellido),
				telefono: familiar.telefono?.toLocaleUpperCase(),
			},
		});
		return mapFamiliar(familiarRespInsert);
	};

	relateScoutToFamiliar = async (
		familiarId: string,
		scoutId: string,
		relacionInput: RelacionFamiliarType,
	) => {
		const response = await prismaClient.familiarScout.create({
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
										sexo: true,
									},
								}
							}
						}
					}
				},
			},
		});

		const { familiar: { padreScout, ...data } } = response;
		const scoutFamiliares = padreScout.map((scout: any) => mapPartialScout(scout.scout));
		return { ...mapFamiliar(data), scoutFamiliares } as any;
	};

	unrelateScoutToFamiliar = async (familiarId: string, scoutId: string) => {

		const resp = await prismaClient.familiarScout.deleteMany({
			where: {
				familiarId: familiarId,
				scoutId: scoutId,
			},
		});

		if (resp.count === 0) {
			return null;
		}

		const responseItem = await prismaClient.familiar.findUnique({
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
								sexo: true,
							},
						},
					},
				},
			},
		});

		if (!responseItem) return null

		const { padreScout, ...data } = responseItem;
		const scoutFamiliares = padreScout.map((scout: any) => ({ ...mapPartialScout(scout.scout), relacion: scout.relacion }));
		return { ...mapFamiliar(data), scoutFamiliares } as any;
	};

	getFamiliar = async (id: string) => {
		try {
			const responseItem = await prismaClient.familiar.findUnique({
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
									sexo: true,
								},
							},
						},
					},
				},
			});

			if (responseItem) {
				const { padreScout, ...data } = responseItem;
				const scoutFamiliares = padreScout.map((scout: any) => ({ ...mapPartialScout(scout.scout), relacion: scout.relacion }));
				return { ...mapFamiliar(data), scoutFamiliares } as any;
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
			existingUser,
			ramaFilter,
			familiarUuid,
		} = filters;

		const nombreNorm = normalizeText(nombre);

		const scopingConditions: Prisma.FamiliarWhereInput[] = []
		if (familiarUuid) {
			scopingConditions.push({ uuid: familiarUuid })
		}
		if (ramaFilter) {
			scopingConditions.push({ padreScout: { some: { scout: { rama: ramaFilter } } } })
		}

		const whereClause: Prisma.FamiliarWhereInput = {
			AND: [
				...scopingConditions,
				{
					OR: [
						{
							padreScout: {
								some: {
									scout: {
										OR: [
											{ nombreNormalizado: { contains: nombreNorm } },
											{ apellidoNormalizado: { contains: nombreNorm } },
											{ uuid: { equals: scoutId } },
										]
									}
								}
							}
						},
						{
							OR: [
								{ nombreNormalizado: { contains: nombreNorm } },
								{ apellidoNormalizado: { contains: nombreNorm } },
							]
						},
					],
					...(scoutId ? {
						padreScout: {
							some: {
								scout: { uuid: scoutId },
							}
						}
					} : {}),
					user: existingUser
						? (existingUser === "true"
							? { isNot: null }
							: { is: null }
						) : undefined
				}
			]
		};

		if (select) {
			const responses = await prismaClient.familiar.findMany({
				skip: offset,
				take: limit,
				orderBy: { nombre: "asc" },
				where: whereClause,
				select,
			});
			return responses.map(familiar => mapFamiliar(familiar as any));
		}

		const responses = await prismaClient.familiar.findMany({
			skip: offset,
			take: limit,
			orderBy: { nombre: "asc" },
			where: whereClause,
			include: {
				padreScout: {
					...(scoutId ? { where: { scout: { uuid: scoutId } } } : {}),
					include: {
						scout: {
							select: {
								uuid: true,
								nombre: true,
								apellido: true,
							}
						}
					}
				}
			},
		});

		return responses.map(({ padreScout, ...familiar }) => ({
			...mapFamiliar(familiar),
			scouts: padreScout.map(ps => ({
				id: ps.scout.uuid,
				nombre: ps.scout.nombre,
				apellido: ps.scout.apellido,
				...(scoutId ? { relacion: ps.relacion } : {}),
			}))
		}));

	};

	updateFamiliar = async (id: string, dataUpdated: Omit<IFamiliar, "id">) => {
		const { nombre, apellido, ...rest } = dataUpdated as Partial<IFamiliar>;
		const { padreScout, ...data } = await prismaClient.familiar.update({
			where: { uuid: id },
			data: {
				...rest,
				...(nombre ? {
					nombre: nombre.toLocaleUpperCase(),
					nombreNormalizado: normalizeText(nombre.toLocaleUpperCase()),
				} : {}),
				...(apellido ? {
					apellido: apellido.toLocaleUpperCase(),
					apellidoNormalizado: normalizeText(apellido.toLocaleUpperCase()),
				} : {}),
			} as any,
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
								sexo: true,
							},
						},
					},
				},
			},
		});
		const scoutFamiliares = padreScout.map((scout: any) => mapPartialScout(scout.scout));
		return { ...mapFamiliar(data), scoutFamiliares } as any;
	};

	findByDni = async (dni: string) => {
		const responseItem = await prismaClient.familiar.findFirst({
			where: { dni },
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
								sexo: true,
							},
						},
					},
				},
			},
		});
		if (!responseItem) return null;
		const { padreScout, ...data } = responseItem;
		const scoutFamiliares = padreScout.map((ps: any) => mapPartialScout(ps.scout));
		return { ...mapFamiliar(data), scoutFamiliares };
	};

	/**
	 * Busca familiar por número de teléfono.
	 * La comparación es flexible: busca si el campo telefono del familiar
	 * contiene el sufijo del número recibido (últimos 8 dígitos).
	 */
	findByTelefono = async (telefono: string) => {
		const digits = telefono.replace(/\D/g, "");
		// Usar los últimos 8 dígitos para tolerar prefijos variables (54, 0, 15, etc.)
		const suffix = digits.slice(-8);

		const familiares = await prismaClient.familiar.findMany({
			where: { telefono: { not: null } },
			include: {
				padreScout: {
					include: {
						scout: {
							select: { id: true, uuid: true, nombre: true, apellido: true, fechaNacimiento: true, sexo: true },
						},
					},
				},
			},
		});

		const encontrado = familiares.find((f) => {
			if (!f.telefono) return false;
			return f.telefono.replace(/\D/g, "").endsWith(suffix);
		});

		if (!encontrado) return null;
		const { padreScout, ...data } = encontrado;
		const scoutFamiliares = padreScout.map((ps: any) => mapPartialScout(ps.scout));
		return { ...mapFamiliar(data), scoutFamiliares };
	};

	/**
	 * Busca familiar por nombre o apellido (contains, case-insensitive via SQLite collation).
	 * Devuelve el primer match con sus scouts vinculados.
	 */
	findByNombre = async (nombre: string) => {
		const nombreNorm = normalizeText(nombre);
		const responseItem = await prismaClient.familiar.findFirst({
			where: {
				OR: [
					{ nombreNormalizado: { contains: nombreNorm } },
					{ apellidoNormalizado: { contains: nombreNorm } },
				],
			},
			include: {
				padreScout: {
					include: {
						scout: {
							select: { id: true, uuid: true, nombre: true, apellido: true, fechaNacimiento: true, sexo: true },
						},
					},
				},
			},
		});
		if (!responseItem) return null;
		const { padreScout, ...data } = responseItem;
		const scoutFamiliares = padreScout.map((ps: any) => mapPartialScout(ps.scout));
		return { ...mapFamiliar(data), scoutFamiliares };
	};

	getTelefonos = async (): Promise<string[]> => {
		const results = await prismaClient.familiar.findMany({
			where: { telefono: { not: null } },
			select: { telefono: true },
		});
		return results.map(f => f.telefono!);
	};

	deleteFamiliar = async (id: string) => {
		const responseItem = await prismaClient.familiar.delete({
			where: { uuid: id },
		});

		await prismaClient.familiarScout.deleteMany({
			where: {
				familiarId: id,
			},
		});

		return mapFamiliar(responseItem);
	};
}

