import {
	FuncionType,
	IDocumento,
	IDocumentoData,
	ProgresionType,
	RamasType,
} from "../types";
import { nanoid } from "nanoid";
import { prismaClient } from "../utils/lib/prisma-client";
import { AppError, HttpCode } from "../utils";
import { AutorizacionSalidasCercanas } from "../utils/classes/documentos/AutorizacionSalidasCercanas";
import { CaratulaLegajo } from "../utils/classes/documentos/CaratulaLegajo";
import { AutorizacionIngresoMenores } from "../utils/classes/documentos/AutorizacionIngresoMenores";
import { AutorizacionRetiro } from "../utils/classes/documentos/AutorizacionRetiro";
import { AutorizacionUsoImagen } from "../utils/classes/documentos/AutorizacionUsoImagen";
import { Documento } from "@prisma/client";
import { getFileInS3, uploadToS3 } from "../utils/lib/s3.util";
import { PdfDocument } from '../utils/classes/documentos/PdfDocument';
import { mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import logger from "../utils/classes/Logger";

const UPLOADS_PATH = resolve("src/public/docs")

type FillDocumentoData = {
	scoutId: string,
	familiarId: string,
	cicloActividades: string,
	rangoDistanciaPermiso: string,
	docData: Documento
}

type PdfModelFuncKeys = "Caratula legajo" | "Autorizacion de uso de imagen" | "Autorizacion para retiro de jovenes" | "Autorizacion ingreso de menores de edad" | "Autorizacion de salidas cercanas";

const pdfModelsFuncs: Record<PdfModelFuncKeys, Function> = {
	"Caratula legajo": ({ docData, scoutId }: FillDocumentoData) => {
		return new CaratulaLegajo({
			documentName: docData.nombre,
			scoutId
		})
	},
	"Autorizacion de uso de imagen": ({ docData, scoutId, familiarId }: FillDocumentoData) => {
		return new AutorizacionUsoImagen({
			documentName: docData.nombre,
			scoutId,
			familiarId
		})
	},
	"Autorizacion para retiro de jovenes": ({ docData, scoutId, familiarId }: FillDocumentoData) => {
		return new AutorizacionRetiro({
			documentName: docData.nombre,
			scoutId,
			familiarId
		})
	},
	"Autorizacion ingreso de menores de edad": ({ docData, scoutId, familiarId }: FillDocumentoData) => {
		return new AutorizacionIngresoMenores({
			documentName: docData.nombre,
			scoutId,
			familiarId
		})
	},
	"Autorizacion de salidas cercanas": ({ docData, scoutId, familiarId, cicloActividades, rangoDistanciaPermiso }: FillDocumentoData) => {
		return new AutorizacionSalidasCercanas({
			documentName: docData.nombre,
			scoutId,
			familiarId,
			cicloActividades,
			rangoDistanciaPermiso
		})
	}
}



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

			if (!familiarId) throw new AppError({
				name: "NOT_FOUND",
				httpCode: HttpCode.BAD_REQUEST,
				description: "No se enviaron datos del familiar"

			})
			const pdfModel: (PdfDocument) = pdfModelsFuncs[docData.nombre as PdfModelFuncKeys]({ docData, scoutId, familiarId, cicloActividades, rangoDistanciaPermiso })

			await pdfModel.getData()
			pdfModel.mapData()
			const pdfData = await pdfModel.fill()
			const uploadFileName = pdfModel.uploadPath
			const uploadId = pdfModel.uploadId
			const eTag = await uploadToS3(pdfData, uploadFileName)
			return { eTag, uploadId }

		} catch (error) {
			return null;
		}
	}

	getFilledDocumento = async (id: string) => {
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

			if (!responseItem) return false

			const { uploadId, documento: { nombre }, scoutId } = responseItem

			if (!uploadId || !scoutId) return false
			const fileName = `${scoutId}/${nombre.split(" ").join("_")}_${uploadId}.pdf`
			const fileInS3 = await getFileInS3(fileName)
			// // const fileData = await fileInS3?.Body?.transformToString()
			// // if (!fileData) return false

			// // const dir = join(UPLOADS_PATH, fileName.split("/").slice(0, -1).join("/"))
			// // await mkdir(dir, { recursive: true })
			// // const filePath = `${UPLOADS_PATH}/${fileName}`
			// // await writeFile(filePath, fileData)
			return {
				fileUrl: fileInS3
			}
		} catch (error) {
			logger.error(error as string);
			return null;
		}
	}
}
