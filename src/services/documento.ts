import {
	FuncionType,
	IDocumento,
	IDocumentoEntregado,
	PDFDocumentsEnum,
	ProgresionType,
	RamasType,
} from "../types";
import { nanoid } from "nanoid";
import { prismaClient } from "../utils/lib/prisma-client";
import { AppError, HttpCode } from "../utils";
import { getFileInS3 } from "../utils/lib/s3.util";
import { PdfDocument } from '../utils/classes/documentos/PdfDocument';
import logger from "../utils/classes/Logger";
import { FillDocumentoData, PDFDocumentInstantiator } from "../utils/classes/documentos/DocumentoInstantiator";

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
		scoutId?: string;
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
	insertDocumento: (documento: IDocumento) => Promise<IDocumentoEntregado | null>;
	getDocumentos: (params: getQueryParams) => Promise<IDocumentoEntregado[]>;
	getDocumento: (id: string) => Promise<IDocumentoEntregado | null>;
	deleteDocumento: (id: string) => Promise<IDocumentoEntregado | null>;
}

export class DocumentoService implements IDocumentoService {
	insertDocumento = async ({ documentoId, fechaPresentacion, scoutId, uploadId }: IDocumento) => {

		const uuid = nanoid(10);
		const responseInsert = await DocumentoModel.create({
			data: {
				uuid,
				documentoId: documentoId,
				scoutId: scoutId,
				uploadId: uploadId,
				fechaPresentacion: fechaPresentacion,
			},
			include: {
				documento: {
					select: {
						nombre: true,
						vence: true,
						completable: true,
						fileUploadId: true,
						requiereFamiliar: true,
						requiereFirma: true
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

		const docName = responseInsert.documento.nombre.split(" ").join("_")
		const fileName = `${scoutId}/${docName}_${uploadId}.pdf`
		const fileInS3 = await getFileInS3(fileName)
		return {
			...responseInsert,
			fileUrl: fileInS3
		};
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
			scoutId,
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
						completable: true,
						fileUploadId: true,
						requiereFamiliar: true,
						requiereFirma: true
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
					},
					uuid: scoutId
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
							completable: true,
							fileUploadId: true,
							requiereFamiliar: true,
							requiereFirma: true
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
						completable: true,
						fileUploadId: true,
						requiereFamiliar: true,
						requiereFirma: true
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

	fillDocumento = async (data: FillDocumentoData) => {
		try {
			const {
				scoutId,
				signature,
				familiarId,
				theme,
				cicloActividades,
				rangoDistanciaPermiso,
				fechaEventoComienzo,
				fechaEventoFin,
				lugarEvento,
				tipoEvento,
				retiroData,
				fechaPago,
				listaPagos,
				aclaraciones,
				confirmation,
				documentoFilled
			} = data

			const docData = (await DocumentosDataModel.findUnique({
				where: {
					uuid: data.documentoId
				}
			}))!

			if (!docData.fileUploadId || !docData.completable) throw new AppError({
				name: "BAD_REQUEST",
				httpCode: HttpCode.BAD_REQUEST,
				description: "El documento enviado no es completable"
			})

			if (!PDFDocumentInstantiator[docData.nombre as PDFDocumentsEnum]) throw new AppError({
				name: "BAD_REQUEST",
				httpCode: HttpCode.BAD_REQUEST,
				description: "La complecion del documento no se encuentra implementada"
			})

			const pdfModel: (PdfDocument) = PDFDocumentInstantiator[docData.nombre as PDFDocumentsEnum]({
				docData,
				scoutId,
				signature,
				theme,
				familiarId,
				cicloActividades,
				rangoDistanciaPermiso,
				lugarEvento,
				fechaEventoComienzo,
				fechaEventoFin,
				tipoEvento,
				retiroData,
				fechaPago,
				listaPagos,
				aclaraciones,
				documentoFilled
			})

			if (!documentoFilled) {
				await pdfModel.getData()
				pdfModel.mapData()
				const base64str = await pdfModel.fill({ returnBase64: true })
				if (!base64str) {
					throw new AppError({
						name: "BAD_REQUEST",
						httpCode: HttpCode.BAD_REQUEST,
						description: "Error al completar el documento"
					})
				}
				return { data: base64str as string }
			}

			if (documentoFilled && !confirmation) {
				const base64str = await pdfModel.sign({ returnBase64: true })
				return { data: base64str as string }
			}

			await pdfModel.upload()
			return { uploadId: pdfModel.uploadId }

		} catch (error) {
			logger.debug(error as string)
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
			return {
				fileUrl: fileInS3
			}
		} catch (error) {
			logger.error(error as string);
			return null;
		}
	}
}

