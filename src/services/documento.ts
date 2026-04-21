import {
	FuncionType,
	IDocumento,
	IDocumentoEntregado,
	PDFDocumentsEnum,
	ProgresionType,
	RamasType,
} from "../types";
import { nanoid } from "nanoid";
import { AppError, HttpCode } from "../utils";
import { getFileInS3, uploadToS3 } from "../utils/lib/s3.util";
import { PdfDocument } from '../utils/classes/documentos/PdfDocument';
import logger from "../utils/classes/Logger";
import { FillDocumentoData, resolvePdfDocumentInstantiator } from "../utils/classes/documentos/DocumentoInstantiator";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapDocumentoPresentado, mapDocumentoDefinicion } from "../mappers/documentoPresentado";
import { scanAuthorizationDocument, AuthorizationDocumentScanResult } from "../utils/lib/gemini";


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
		familiarId?: string;
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
		const responseInsert = await prismaClient.documentoPresentado.create({
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
			...mapDocumentoPresentado(responseInsert),
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
			familiarId,
		} = filters;

		const responseItem = await prismaClient.documentoPresentado.findMany({
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
					uuid: scoutId,
					familiarScout: familiarId
						? { some: { familiarId } }
						: undefined,
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

		return responseItem.map(doc => mapDocumentoPresentado(doc));
	};
	getDocumentosData = async () => {
		const responseItem = await prismaClient.documento.findMany();
		return responseItem.map(doc => mapDocumentoDefinicion(doc));
	};
	getDocumento = async (id: string) => {
		try {
			const responseItem = await prismaClient.documentoPresentado.findUnique({
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

			return responseItem ? mapDocumentoPresentado(responseItem) : null;
		} catch (error) {
			return null;
		}
	};
	deleteDocumento = async (id: string) => {
		const responseItem = await prismaClient.documentoPresentado.delete({
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

		return mapDocumentoPresentado(responseItem) as any;
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
				transporteContratadoOpcion,
				transporteAlternativoDescripcion,
				transporteLlegadaDiaHorario,
				transporteRetiroDiaHorario,
				transporteCelularContacto,
				avalAclaracion,
				avalDni,
				avalFuncionGrupoScout,
				pago,
				numeroRecibo,
				aclaraciones,
				confirmation,
				documentoFilled
			} = data

			const docData = (await prismaClient.documento.findUnique({
				where: {
					uuid: data.documentoId
				}
			}))!

			const mappedDocData = mapDocumentoDefinicion(docData);

			if (!mappedDocData.fileUploadId || !mappedDocData.completable) throw new AppError({
				name: "BAD_REQUEST",
				httpCode: HttpCode.BAD_REQUEST,
				description: "El documento enviado no es completable"
			})

			const pdfDocumentInstantiator = resolvePdfDocumentInstantiator(mappedDocData.nombre);

			if (!pdfDocumentInstantiator) throw new AppError({
				name: "BAD_REQUEST",
				httpCode: HttpCode.BAD_REQUEST,
				description: "La complecion del documento no se encuentra implementada"
			})
			const pdfModel: (PdfDocument) = pdfDocumentInstantiator({
				docData: mappedDocData,
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
				transporteContratadoOpcion,
				transporteAlternativoDescripcion,
				transporteLlegadaDiaHorario,
				transporteRetiroDiaHorario,
				transporteCelularContacto,
				avalAclaracion,
				avalDni,
				avalFuncionGrupoScout,
				pago,
				numeroRecibo,
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
			const responseItem = await prismaClient.documentoPresentado.findUnique({
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

			// Support both legacy format (plain uploadId → .pdf) and new format (uploadId contains full relative key)
			const fileName = uploadId.includes("/")
				? uploadId
				: `${scoutId}/${nombre.split(" ").join("_")}_${uploadId}.pdf`

			const fileInS3 = await getFileInS3(fileName)
			return {
				fileUrl: fileInS3
			}
		} catch (error) {
			logger.error(error as string);
			return null;
		}
	}

	uploadArchivoDocumento = async (id: string, fileBuffer: Buffer, mimeType: string) => {
		try {
			const ext = mimeType === "image/jpeg" ? "jpg" : "pdf";
			const contentType = mimeType === "image/jpeg" ? "image/jpeg" : "application/pdf";

			const responseItem = await prismaClient.documentoPresentado.findUnique({
				where: { uuid: id },
				include: { documento: { select: { nombre: true } } },
			});

			if (!responseItem) return null;

			const docName = responseItem.documento.nombre.split(" ").join("_");
			const fileKey = `documentos/${id}/${docName}_${nanoid(10)}.${ext}`;

			await uploadToS3(fileBuffer, fileKey, contentType);

			await prismaClient.documentoPresentado.update({
				where: { uuid: id },
				data: { uploadId: fileKey },
			});

			const fileUrl = await getFileInS3(fileKey);
			return { fileUrl };
		} catch (error) {
			logger.error(error as string);
			return null;
		}
	}

	getDocumentosPendientes = async (familiarId: string) => {
		const familiar = await prismaClient.familiar.findUnique({
			where: { uuid: familiarId },
			include: {
				padreScout: {
					include: {
						scout: {
							select: { uuid: true, nombre: true, apellido: true },
						},
					},
				},
			},
		});

		if (!familiar) return [];

		const startOfYear = new Date(new Date().getFullYear(), 0, 1);
		const allCompletable = await prismaClient.documento.findMany({
			where: { completable: true },
		});

		const results: {
			documentoId: string;
			documentoNombre: string;
			scoutId: string;
			scoutNombre: string;
			scoutApellido: string;
			requiereFamiliar: boolean;
		}[] = [];

		for (const { scout } of familiar.padreScout) {
			const submitted = await prismaClient.documentoPresentado.findMany({
				where: { scoutId: scout.uuid },
				select: { documentoId: true, fechaPresentacion: true },
			});

			for (const doc of allCompletable) {
				const entregas = submitted.filter((s) => s.documentoId === doc.uuid);
				const esPendiente = doc.vence
					? !entregas.some(
						(s) =>
							s.fechaPresentacion !== null &&
							new Date(s.fechaPresentacion) >= startOfYear,
					)
					: entregas.length === 0;

				if (esPendiente) {
					results.push({
						documentoId: doc.uuid,
						documentoNombre: doc.nombre,
						scoutId: scout.uuid,
						scoutNombre: scout.nombre,
						scoutApellido: scout.apellido,
						requiereFamiliar: doc.requiereFamiliar,
					});
				}
			}
		}

		return results;
	};

	scanDocumento = async (pdfBuffer: Buffer): Promise<AuthorizationDocumentScanResult> => {
		return scanAuthorizationDocument(pdfBuffer);
	};

	confirmScanDocumento = async ({
		scoutId,
		familiarId,
		documentoId,
		fechaPresentacion,
		pdfBuffer,
	}: {
		scoutId: string;
		familiarId?: string;
		documentoId: string;
		fechaPresentacion?: Date;
		pdfBuffer: Buffer;
	}) => {
		const uploadId = nanoid(10);

		const documento = await prismaClient.documento.findUniqueOrThrow({
			where: { uuid: documentoId },
		});

		const docName = documento.nombre.split(" ").join("_");
		const fileName = `${scoutId}/${docName}_${uploadId}.pdf`;

		await uploadToS3(pdfBuffer, fileName);

		const created = await prismaClient.documentoPresentado.create({
			data: {
				uuid: nanoid(10),
				documentoId,
				scoutId,
				familiarId: familiarId ?? null,
				uploadId,
				fechaPresentacion: fechaPresentacion ?? new Date(),
			},
			include: {
				documento: {
					select: {
						nombre: true,
						vence: true,
						completable: true,
						fileUploadId: true,
						requiereFamiliar: true,
						requiereFirma: true,
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

		const fileUrl = await getFileInS3(fileName);
		return { ...mapDocumentoPresentado(created), fileUrl };
	};
}
