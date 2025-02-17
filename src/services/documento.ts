import {
	FuncionType,
	IDocumento,
	IDocumentoData,
	ProgresionType,
	RamasType,
} from "../types";
import { nanoid } from "nanoid";
import { prismaClient } from "../utils/lib/prisma-client";
import { join } from "path";
import { AppError, HttpCode } from "../utils";
import { AutorizacionSalidasCercanas } from "../utils/classes/documentos/AutorizacionSalidasCercanas";
import { CaratulaLegajo } from "../utils/classes/documentos/CaratulaLegajo";
import { AutorizacionIngresoMenores } from "../utils/classes/documentos/AutorizacionIngresoMenores";
import { AutorizacionRetiro } from "../utils/classes/documentos/AutorizacionRetiro";
import { AutorizacionUsoImagen } from "../utils/classes/documentos/AutorizacionUsoImagen";

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


	fillDocumento = async (id: string, data: {
		scoutId: string,
		familiarId?: string,
		cicloActividades?: string,
		rangoDistanciaPermiso?: string
	}
	) => {

		try {
			const {
				scoutId,
				familiarId,
				cicloActividades = "2025",
				rangoDistanciaPermiso = "5 Kilometros"
			} = data

			const docData = (await DocumentosDataModel.findUnique({
				where: {
					uuid: id
				}
			}))!

			let pdfModel;
			switch (docData.nombre) {
				case "Caratula legajo":
					pdfModel = new CaratulaLegajo({
						documentName: docData.nombre,
						scoutId
					})
					break;
				case "Autorizacion de uso de imagen":
					if (!familiarId) throw new AppError({
						name: "NOT_FOUND",
						httpCode: HttpCode.BAD_REQUEST,
						description: "No se enviaron datos del familiar"
					});
					pdfModel = new AutorizacionUsoImagen({
						documentName: docData.nombre,
						scoutId,
						familiarId
					})
					break;
				case "Autorizacion para retiro de jovenes":
					if (!familiarId) throw new AppError({
						name: "NOT_FOUND",
						httpCode: HttpCode.BAD_REQUEST,
						description: "No se enviaron datos del familiar"
					});
					pdfModel = new AutorizacionRetiro({
						documentName: docData.nombre,
						scoutId,
						familiarId
					})
					break;
				case "Autorizacion ingreso de menores de edad":
					if (!familiarId) throw new AppError({
						name: "NOT_FOUND",
						httpCode: HttpCode.BAD_REQUEST,
						description: "No se enviaron datos del familiar"
					});
					pdfModel = new AutorizacionIngresoMenores({
						documentName: docData.nombre,
						scoutId,
						familiarId
					})
					break;
				case "Autorizacion de salidas cercanas":
					if (!familiarId) throw new AppError({
						name: "NOT_FOUND",
						httpCode: HttpCode.BAD_REQUEST,
						description: "No se enviaron datos del familiar"
					});
					pdfModel = new AutorizacionSalidasCercanas({
						documentName: docData.nombre,
						scoutId,
						familiarId,
						cicloActividades,
						rangoDistanciaPermiso
					})
					break;

				default:
					break;
			}

			await pdfModel!.getData()
			pdfModel!.mapData()
			return await pdfModel!.fill()

		} catch (error) {
			return null;
		}
	}
}
