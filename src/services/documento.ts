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
import type { Prisma } from "@prisma/client";
import { getFileInS3, uploadToS3 } from "../utils/lib/s3.util";
import { PdfDocument } from '../utils/classes/documentos/PdfDocument';
import logger from "../utils/classes/Logger";
import { FillDocumentoData, resolvePdfDocumentInstantiator } from "../utils/classes/documentos/DocumentoInstantiator";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapDocumentoPresentado, mapDocumentoDefinicion } from "../mappers/documentoPresentado";
import { scanAuthorizationDocument, AuthorizationDocumentScanResult } from "../utils/lib/gemini";
import type { ScopingContext } from "../utils/helpers/buildScopingContext";


export type BulkScanConfidence = "high" | "none";

export type BulkScanMatchedScout = {
	id: string;
	nombre: string;
	apellido: string;
};

export type BulkScanMatchedDocumento = {
	id: string;
	nombre: string;
};

export type BulkScanItem = {
	index: number;
	extractedData: AuthorizationDocumentScanResult | null;
	matchedScout: BulkScanMatchedScout | null;
	matchedDocumento: BulkScanMatchedDocumento | null;
	scoutConfidence: BulkScanConfidence;
	documentoConfidence: BulkScanConfidence;
};

type getQueryParams = {
	limit?: number;
	offset?: number;
	filters: {
		nombre?: string;
		scoutId?: string;
		requiereRenovacionAnual?: string;
		tiempoDesde?: Date;
		tiempoHasta?: Date;
		equipos?: string[];
		funciones?: FuncionType[];
		ramas?: RamasType[];
		progresiones?: ProgresionType[]
		familiarId?: string;
	};
};

type DocumentoPendienteEstado = "FALTANTE" | "VENCIDO_ANUAL";

type DocumentoPendienteData = {
	documentoId: string;
	documentoNombre: string;
	scoutId: string;
	scoutNombre: string;
	scoutApellido: string;
	estado: DocumentoPendienteEstado;
	requiereDatosFamiliar: boolean;
	// Compatibilidad hacia atrás para consumidores viejos.
	requiereFamiliar: boolean;
	requiereRenovacionAnual: boolean;
	completableDinamicamente: boolean;
	anioUltimaPresentacion: number | null;
};

type GetDocumentosPendientesParams = {
	scopingContext: ScopingContext;
	familiarId?: string;
	soloCompletable?: boolean;
	offset?: number;
	limit?: number;
};

interface IDocumentoService {
	insertDocumento: (documento: IDocumento) => Promise<IDocumentoEntregado | null>;
	getDocumentos: (params: getQueryParams) => Promise<IDocumentoEntregado[]>;
	getDocumento: (id: string) => Promise<IDocumentoEntregado | null>;
	deleteDocumento: (id: string) => Promise<IDocumentoEntregado | null>;
}

export class DocumentoService implements IDocumentoService {
	private getCalendarYearArgentina = (date: Date) =>
		Number(
			new Intl.DateTimeFormat("en-US", {
				timeZone: "America/Argentina/Buenos_Aires",
				year: "numeric",
			}).format(date),
		);

	private getCurrentCalendarYearArgentina = () =>
		this.getCalendarYearArgentina(new Date());

	private resolveScoutsForPending = async ({
		scopingContext,
		familiarId,
	}: {
		scopingContext: ScopingContext;
		familiarId?: string;
	}) => {
		const andConditions: Prisma.ScoutWhereInput[] = [];

		if (scopingContext.scope === "FAMILIAR" && !scopingContext.familiarId) {
			return [];
		}

		if (scopingContext.scope === "RAMA") {
			if (!scopingContext.rama) return [];
			andConditions.push({ rama: scopingContext.rama });
		}

		const familiarFilter =
			scopingContext.scope === "FAMILIAR"
				? scopingContext.familiarId
				: familiarId;

		if (familiarFilter) {
			andConditions.push({
				familiarScout: { some: { familiarId: familiarFilter } },
			});
		}

		return prismaClient.scout.findMany({
			where: andConditions.length ? { AND: andConditions } : undefined,
			select: {
				uuid: true,
				nombre: true,
				apellido: true,
			},
		});
	};

	private computePendingDocumentsForScouts = async ({
		scouts,
		soloCompletable = false,
	}: {
		scouts: Array<{ uuid: string; nombre: string; apellido: string }>;
		soloCompletable?: boolean;
	}): Promise<DocumentoPendienteData[]> => {
		if (scouts.length === 0) return [];

		const docsRequeridos = await prismaClient.documento.findMany({
			where: {
				requeridoParaIngreso: true,
				...(soloCompletable ? { completableDinamicamente: true } : {}),
			},
			select: {
				uuid: true,
				nombre: true,
				requiereDatosFamiliar: true,
				requiereRenovacionAnual: true,
				completableDinamicamente: true,
			},
		});

		if (docsRequeridos.length === 0) return [];

		const scoutIds = scouts.map((scout) => scout.uuid);
		const docsIds = docsRequeridos.map((doc) => doc.uuid);
		const entregas = await prismaClient.documentoPresentado.findMany({
			where: {
				scoutId: { in: scoutIds },
				documentoId: { in: docsIds },
			},
			select: {
				scoutId: true,
				documentoId: true,
				fechaPresentacion: true,
			},
		});

		const entregasPorScoutYDocumento = new Map<string, Date[]>();
		for (const entrega of entregas) {
			if (!entrega.scoutId) continue;
			const key = `${entrega.scoutId}::${entrega.documentoId}`;
			const existing = entregasPorScoutYDocumento.get(key) ?? [];
			existing.push(new Date(entrega.fechaPresentacion));
			entregasPorScoutYDocumento.set(key, existing);
		}

		const currentYear = this.getCurrentCalendarYearArgentina();
		const results: DocumentoPendienteData[] = [];

		for (const scout of scouts) {
			for (const doc of docsRequeridos) {
				const key = `${scout.uuid}::${doc.uuid}`;
				const fechas = entregasPorScoutYDocumento.get(key) ?? [];
				const aniosPresentados = fechas.map((fecha) =>
					this.getCalendarYearArgentina(fecha),
				);
				const anioUltimaPresentacion =
					aniosPresentados.length > 0 ? Math.max(...aniosPresentados) : null;

				let estado: DocumentoPendienteEstado | null = null;

				if (doc.requiereRenovacionAnual) {
					if (anioUltimaPresentacion === null || anioUltimaPresentacion < currentYear) {
						estado =
							anioUltimaPresentacion === null
								? "FALTANTE"
								: "VENCIDO_ANUAL";
					}
				} else if (fechas.length === 0) {
					estado = "FALTANTE";
				}

				if (!estado) continue;

				results.push({
					documentoId: doc.uuid,
					documentoNombre: doc.nombre,
					scoutId: scout.uuid,
					scoutNombre: scout.nombre,
					scoutApellido: scout.apellido,
					estado,
					requiereDatosFamiliar: doc.requiereDatosFamiliar,
					requiereFamiliar: doc.requiereDatosFamiliar,
					requiereRenovacionAnual: doc.requiereRenovacionAnual,
					completableDinamicamente: doc.completableDinamicamente,
					anioUltimaPresentacion,
				});
			}
		}

		return results.sort((a, b) => {
			const scoutCompare = `${a.scoutApellido} ${a.scoutNombre}`.localeCompare(
				`${b.scoutApellido} ${b.scoutNombre}`,
				"es",
			);
			if (scoutCompare !== 0) return scoutCompare;
			return a.documentoNombre.localeCompare(b.documentoNombre, "es");
		});
	};

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
						requiereRenovacionAnual: true,
						requeridoParaIngreso: true,
						completableDinamicamente: true,
						googleDriveFileId: true,
						requiereDatosFamiliar: true,
						requiereFirmaFamiliar: true
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
		const fileName = uploadId
			? uploadId.includes("/")
				? uploadId
				: `${scoutId}/${docName}_${uploadId}.pdf`
			: null;
		const fileInS3 = fileName ? await getFileInS3(fileName) : undefined;
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
			requiereRenovacionAnual,
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
						requiereRenovacionAnual: true,
						requeridoParaIngreso: true,
						completableDinamicamente: true,
						googleDriveFileId: true,
						requiereDatosFamiliar: true,
						requiereFirmaFamiliar: true
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
					requiereRenovacionAnual: requiereRenovacionAnual ? requiereRenovacionAnual === "true" ? true : false : undefined,
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
							requiereRenovacionAnual: true,
							requeridoParaIngreso: true,
							completableDinamicamente: true,
							googleDriveFileId: true,
							requiereDatosFamiliar: true,
							requiereFirmaFamiliar: true
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
						requiereRenovacionAnual: true,
						requeridoParaIngreso: true,
						completableDinamicamente: true,
						googleDriveFileId: true,
						requiereDatosFamiliar: true,
						requiereFirmaFamiliar: true
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
				saludData,
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

			if (!mappedDocData.googleDriveFileId || !mappedDocData.completableDinamicamente) throw new AppError({
				name: "BAD_REQUEST",
				httpCode: HttpCode.BAD_REQUEST,
				description: "El documento enviado no es completable dinámicamente"
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
				saludData,
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
							requiereRenovacionAnual: true,
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

	getDocumentosPendientes = async ({
		scopingContext,
		familiarId,
		soloCompletable = false,
		offset,
		limit,
	}: GetDocumentosPendientesParams) => {
		const scouts = await this.resolveScoutsForPending({
			scopingContext,
			familiarId,
		});

		const resultados = await this.computePendingDocumentsForScouts({
			scouts,
			soloCompletable,
		});

		const hasPagination =
			typeof offset === "number" || typeof limit === "number";

		if (!hasPagination) return resultados;

		const safeOffset = Number.isFinite(offset) && (offset as number) > 0
			? Math.floor(offset as number)
			: 0;
		const safeLimit = Number.isFinite(limit) && (limit as number) > 0
			? Math.floor(limit as number)
			: resultados.length;

		return resultados.slice(safeOffset, safeOffset + safeLimit);
	};

	scanDocumento = async (pdfBuffer: Buffer): Promise<AuthorizationDocumentScanResult> => {
		return scanAuthorizationDocument(pdfBuffer);
	};

	private matchScoutByExtracted = async (
		extracted: AuthorizationDocumentScanResult["scout"],
	): Promise<{ scout: BulkScanMatchedScout | null; confidence: BulkScanConfidence }> => {
		// 1. DNI exact match — más confiable
		if (extracted.dni) {
			const scout = await prismaClient.scout.findFirst({
				where: { dni: extracted.dni },
				select: { uuid: true, nombre: true, apellido: true },
			});
			if (scout)
				return {
					scout: { id: scout.uuid, nombre: scout.nombre, apellido: scout.apellido },
					confidence: "high",
				};
		}

		// 2. Nombre + apellido
		if (extracted.nombre && extracted.apellido) {
			const scout = await prismaClient.scout.findFirst({
				where: {
					nombre: { contains: extracted.nombre },
					apellido: { contains: extracted.apellido },
				},
				select: { uuid: true, nombre: true, apellido: true },
			});
			if (scout)
				return {
					scout: { id: scout.uuid, nombre: scout.nombre, apellido: scout.apellido },
					confidence: "high",
				};
		}

		// 3. Fecha de nacimiento — puede haber múltiples coincidencias, se desempata con otros campos
		if (extracted.fechaNacimiento) {
			const parsed = new Date(extracted.fechaNacimiento);
			if (!isNaN(parsed.getTime())) {
				const startOfDay = new Date(`${extracted.fechaNacimiento}T00:00:00.000Z`);
				const endOfDay = new Date(`${extracted.fechaNacimiento}T23:59:59.999Z`);

				const candidates = await prismaClient.scout.findMany({
					where: { fechaNacimiento: { gte: startOfDay, lte: endOfDay } },
					select: { uuid: true, nombre: true, apellido: true, dni: true },
				});

				if (candidates.length === 1) {
					const s = candidates[0];
					return {
						scout: { id: s.uuid, nombre: s.nombre, apellido: s.apellido },
						confidence: "high",
					};
				}

				if (candidates.length > 1) {
					let narrowed = candidates;

					if (extracted.dni) {
						const byDni = narrowed.filter((s) => s.dni === extracted.dni);
						if (byDni.length > 0) narrowed = byDni;
					}

					if (narrowed.length > 1 && extracted.apellido) {
						const byApellido = narrowed.filter((s) =>
							s.apellido.toLowerCase().includes(extracted.apellido!.toLowerCase()),
						);
						if (byApellido.length > 0) narrowed = byApellido;
					}

					if (narrowed.length > 1 && extracted.nombre) {
						const byNombre = narrowed.filter((s) =>
							s.nombre.toLowerCase().includes(extracted.nombre!.toLowerCase()),
						);
						if (byNombre.length > 0) narrowed = byNombre;
					}

					if (narrowed.length === 1) {
						const s = narrowed[0];
						return {
							scout: { id: s.uuid, nombre: s.nombre, apellido: s.apellido },
							confidence: "high",
						};
					}
				}
			}
		}

		return { scout: null, confidence: "none" };
	};

	private matchDocumentoByExtracted = async (
		tipo: string | null,
	): Promise<{ documento: BulkScanMatchedDocumento | null; confidence: BulkScanConfidence }> => {
		if (!tipo) return { documento: null, confidence: "none" };

		const documento = await prismaClient.documento.findFirst({
			where: { nombre: { contains: tipo } },
			select: { uuid: true, nombre: true },
		});

		if (documento)
			return {
				documento: { id: documento.uuid, nombre: documento.nombre },
				confidence: "high",
			};

		return { documento: null, confidence: "none" };
	};

	scanDocumentoBulk = async (
		files: Array<{ buffer: Buffer; mimeType: "application/pdf" | "image/jpeg" }>,
	): Promise<BulkScanItem[]> => {
		return Promise.all(
			files.map(async (file, index) => {
				try {
					const extractedData = await scanAuthorizationDocument(file.buffer, file.mimeType);
					const [scoutMatch, documentoMatch] = await Promise.all([
						this.matchScoutByExtracted(extractedData.scout),
						this.matchDocumentoByExtracted(extractedData.documento.tipo),
					]);
					return {
						index,
						extractedData,
						matchedScout: scoutMatch.scout,
						matchedDocumento: documentoMatch.documento,
						scoutConfidence: scoutMatch.confidence,
						documentoConfidence: documentoMatch.confidence,
					};
				} catch {
					return {
						index,
						extractedData: null,
						matchedScout: null,
						matchedDocumento: null,
						scoutConfidence: "none" as BulkScanConfidence,
						documentoConfidence: "none" as BulkScanConfidence,
					};
				}
			}),
		);
	};

	confirmScanDocumentoBulk = async (
		items: Array<{
			buffer: Buffer;
			mimeType: "application/pdf" | "image/jpeg";
			scoutId: string;
			documentoId: string;
			fechaPresentacion?: Date;
		}>,
	): Promise<Array<{ success: true; data: ReturnType<typeof mapDocumentoPresentado> & { fileUrl: string | null } } | { success: false; index: number; error: string }>> => {
		return Promise.all(
			items.map(async (item, index) => {
				try {
					const documento = await prismaClient.documento.findUniqueOrThrow({
						where: { uuid: item.documentoId },
					});

					const ext = item.mimeType === "image/jpeg" ? "jpg" : "pdf";
					const contentType = item.mimeType === "image/jpeg" ? "image/jpeg" : "application/pdf";
					const uploadId = nanoid(10);
					const docName = documento.nombre.split(" ").join("_");
					const fileName = `${item.scoutId}/${docName}_${uploadId}.${ext}`;

					await uploadToS3(item.buffer, fileName, contentType);

					const created = await prismaClient.documentoPresentado.create({
						data: {
							uuid: nanoid(10),
							documentoId: item.documentoId,
							scoutId: item.scoutId,
							uploadId: fileName,
							fechaPresentacion: item.fechaPresentacion ?? new Date(),
						},
						include: {
							documento: {
								select: {
									nombre: true,
									requiereRenovacionAnual: true,
									requeridoParaIngreso: true,
									completableDinamicamente: true,
									googleDriveFileId: true,
									requiereDatosFamiliar: true,
									requiereFirmaFamiliar: true,
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
					return { success: true as const, data: { ...mapDocumentoPresentado(created), fileUrl } };
				} catch (err) {
					logger.error(err as string);
					return { success: false as const, index, error: "Error al procesar documento" };
				}
			}),
		);
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
						requiereRenovacionAnual: true,
						requeridoParaIngreso: true,
						completableDinamicamente: true,
						googleDriveFileId: true,
						requiereDatosFamiliar: true,
						requiereFirmaFamiliar: true,
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
