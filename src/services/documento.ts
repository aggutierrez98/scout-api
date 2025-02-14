import {
	FuncionType,
	IDocumento,
	IDocumentoData,
	ProgresionType,
	RamasType,
} from "../types";
import { nanoid } from "nanoid";
import { prismaClient } from "../utils/lib/prisma-client";

const prisma = prismaClient.$extends({
	result: {
		documentoPresentado: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
		},
		documento: {
			id: {
				compute: (data) => data.uuid,
			},
			uuid: {
				compute: () => undefined,
			},
		}
	},
});
const DocumentoModel = prisma.documentoPresentado;
const DocumentosDataModel = prisma.documento;

type getQueryParams = {
	limit?: number;
	offset?: number;
	filters: {
		nombre?: string;
		vence?: string;
		tiempoDesde?: Date;
		tiempoHasta?: Date;
		equipos?: string[];
		funciones?: FuncionType[];
		ramas?: RamasType[];
		progresiones?: ProgresionType[]

	};
};

interface IDocumentoService {
	insertDocumento: (documento: IDocumento) => Promise<IDocumentoData | null>;
	getDocumentos: (params: getQueryParams) => Promise<IDocumentoData[]>;
	getDocumento: (id: string) => Promise<IDocumentoData | null>;
	deleteDocumento: (id: string) => Promise<IDocumentoData | null>;
}

export class DocumentoService implements IDocumentoService {
	insertDocumento = async (documento: IDocumento) => {
		const uuid = nanoid(10);

		const responseInsert = await DocumentoModel.create({
			data: {
				...documento,
				uuid,
				documentoId: documento.documentoId,
				scoutId: documento.scoutId,
			},
			include: {
				documento: {
					select: {
						nombre: true,
						vence: true,
					},
				},
				scout: {
					select: {
						nombre: true,
						apellido: true,
					},
				},
			},
		});
		return responseInsert;
	};
	getDocumentos = async ({
		limit = 10,
		offset = 0,
		filters = {},
	}: getQueryParams) => {
		const {
			nombre = "",
			funciones,
			progresiones,
			equipos,
			ramas,
			vence,
			tiempoDesde,
			tiempoHasta,
		} = filters;

		const responseItem = await DocumentoModel.findMany({
			skip: offset,
			take: limit,
			orderBy: { fechaPresentacion: "desc" },
			include: {
				documento: {
					select: {
						nombre: true,
						vence: true,
					},
				},
				scout: {
					select: {
						nombre: true,
						apellido: true,
					},
				},
			},
			where: {
				scout: {
					equipo: {
						uuid: equipos ? { in: equipos } : undefined,
					},
					progresionActual: {
						in: progresiones,
					},
					funcion: {
						in: funciones,
					},
					rama: {
						in: ramas
					}
				},
				documento: {
					vence: vence ? vence === "true" ? true : false : undefined,
				},
				fechaPresentacion: {
					lte: tiempoHasta,
					gte: tiempoDesde,
				},
				OR: [
					{
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
							],
						}
					},
					{
						documento: {
							nombre: {
								contains: nombre,
							},
						},
					}
				],
			},
		});

		return responseItem;
	};
	getDocumentosData = async () => {
		const responseItem = await DocumentosDataModel.findMany();
		return responseItem;
	};
	getDocumento = async (id: string) => {
		try {
			const responseItem = await DocumentoModel.findUnique({
				where: { uuid: id },
				include: {
					documento: {
						select: {
							nombre: true,
							vence: true,
						},
					},
					scout: {
						select: {
							nombre: true,
							apellido: true,
						},
					},
				},
			});

			return responseItem;
		} catch (error) {
			return null;
		}
	};
	deleteDocumento = async (id: string) => {
		const responseItem = await DocumentoModel.delete({
			where: { uuid: id },
			include: {
				documento: {
					select: {
						nombre: true,
						vence: true,
					},
				},
				scout: {
					select: {
						nombre: true,
						apellido: true,
					},
				},
			},
		});

		return responseItem;
	};
}
