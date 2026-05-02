import { Request, Response, NextFunction } from "express";
import { UploadedFile } from "express-fileupload";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { DocumentoService } from "../services/documento";
import type { ScopingContext } from "../utils/helpers/buildScopingContext";

export class DocumentoController {
	public documentoService;

	constructor({ documentoService }: { documentoService: DocumentoService }) {
		this.documentoService = documentoService;
	}

	getItem = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			let response
			if (req.query.download === "true") {
				response = await this.documentoService.getFilledDocumento(id);
			} else {
				response = await this.documentoService.getDocumento(id);
			}

			if (!response) {
				throw new AppError({
					name: "NOT_FOUND",
					httpCode: HttpCode.NOT_FOUND,
				});
			}
			res.send(response);

		} catch (e) {
			next(e);
		}
	};

	getItems = async (req: Request, res: Response, next: NextFunction) => {
		const { offset, limit, ...filters } = req.query;

		const scopingContext: ScopingContext = res.locals.scopingContext
		if (scopingContext.scope === 'RAMA' && scopingContext.rama) {
			(filters as any).ramas = [scopingContext.rama]
		} else if (scopingContext.scope === 'FAMILIAR' && scopingContext.familiarId) {
			(filters as any).familiarId = scopingContext.familiarId
		}

		try {
			const response = await this.documentoService.getDocumentos({
				limit: limit ? Number(limit) : undefined,
				offset: offset ? Number(offset) : undefined,
				filters,
			});
			res.send(response);
		} catch (e) {
			next(e);
		}
	};
	getData = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const response = await this.documentoService.getDocumentosData();
			res.send(response);
		} catch (e) {
			next(e);
		}
	};
	insertItem = async ({ body }: Request, res: Response, next: NextFunction) => {
		try {
			const responseDocumento = await this.documentoService.insertDocumento(
				body,
			);
			res.send(responseDocumento);
		} catch (e) {
			console.log(e)
			next(e);
		}
	};

	fillDocument = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const signature = req.files?.signature

			const responseDocumentoFilled = await this.documentoService.fillDocumento({
				...req.body,
				signature
			});
			if (!responseDocumentoFilled) {
				throw new AppError({
					name: "CREATION_ERROR",
					httpCode: HttpCode.BAD_REQUEST,
					description: "Fallo al crear archivo"
				});
			}

			return res.send({
				msg: "Creado exitosamente",
				data: responseDocumentoFilled
			})

		} catch (e) {
			next(e);
		}
	};

	signDocument = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const signature = req.files?.signature
			const documentoFilled = req.files?.documentoFilled

			const responseDocumentoFilled = await this.documentoService.fillDocumento({
				...req.body,
				documentoFilled,
				signature
			});

			if (!responseDocumentoFilled) {
				throw new AppError({
					name: "CREATION_ERROR",
					httpCode: HttpCode.BAD_REQUEST,
					description: "Fallo al crear archivo"
				});
			}

			return res.send({
				msg: "Creado exitosamente",
				data: responseDocumentoFilled
			})

		} catch (e) {
			next(e);
		}
	};

	uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const responseDocumentoFilled = await this.documentoService.fillDocumento({
				...req.body,
				documentoFilled: req.files?.documentoFilled,
				confirmation: true
			});

			if (!responseDocumentoFilled) {
				throw new AppError({
					name: "CREATION_ERROR",
					httpCode: HttpCode.BAD_REQUEST,
					description: "Fallo al crear archivo"
				});
			}

			const responseDocumento = await this.documentoService.insertDocumento(
				{
					...req.body,
					uploadId: responseDocumentoFilled.uploadId
				}
			);

			return res.json(responseDocumento)

		} catch (e) {
			next(e);
		}
	};

	// downloadFilledDocument = async ({ params }: Request, res: Response, next: NextFunction) => {
	// 	try {
	// 		const { id } = params;
	// 		const responseDocumento = await this.documentoService.getFilledDocumento(id);
	// 		if (!responseDocumento) {
	// 			throw new AppError({
	// 				name: "DOCUMENT_ERROR",
	// 				httpCode: HttpCode.BAD_REQUEST,
	// 				description: "No se pudo descargar el archivo"
	// 			});
	// 		}

	// 		return res.json({
	// 			msg: "Descargado exitosamente",
	// 			data: responseDocumento
	// 		})

	// 	} catch (e) {
	// 		next(e);
	// 	}
	// };

	uploadArchivo = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = req.params;
			const archivo = req.files?.archivo as UploadedFile | undefined;

			if (!archivo) {
				throw new AppError({
					name: "BAD_REQUEST",
					httpCode: HttpCode.BAD_REQUEST,
					description: "Se requiere un archivo en el campo 'archivo'",
				});
			}

			const validMimes = ["application/pdf", "image/jpeg"];
			if (!validMimes.includes(archivo.mimetype)) {
				throw new AppError({
					name: "BAD_REQUEST",
					httpCode: HttpCode.BAD_REQUEST,
					description: "Solo se permiten archivos PDF o JPEG",
				});
			}

			const result = await this.documentoService.uploadArchivoDocumento(id, archivo.data, archivo.mimetype);

			if (!result) {
				throw new AppError({
					name: "NOT_FOUND",
					httpCode: HttpCode.NOT_FOUND,
					description: "Documento no encontrado",
				});
			}

			return res.json(result);
		} catch (e) {
			next(e);
		}
	};

	deleteItem = async (
		{ params }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const { id } = params;
			const response = await this.documentoService.deleteDocumento(id);

			if (!response) {
				throw new AppError({
					name: "NOT_FOUND",
					httpCode: HttpCode.NOT_FOUND,
				});
			}

			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	deleteManyItems = async (
		{ body }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const response = await this.documentoService.deleteDocumentos(body.ids);
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	getDocumentosPendientes = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { familiarId, soloCompletable, offset, limit } = req.query as {
				familiarId?: string;
				soloCompletable?: "true" | "false";
				offset?: string;
				limit?: string;
			};
			const scopingContext: ScopingContext = res.locals.scopingContext;

			if (
				scopingContext.scope === "FAMILIAR" &&
				scopingContext.familiarId &&
				familiarId &&
				scopingContext.familiarId !== familiarId
			) {
				throw new AppError({
					name: "UNAUTHORIZED",
					httpCode: HttpCode.FORBIDDEN,
					description: "No tenés permisos para consultar pendientes de otro familiar",
				});
			}

			const result = await this.documentoService.getDocumentosPendientes({
				scopingContext,
				familiarId,
				soloCompletable: soloCompletable === "true",
				offset: offset ? Number(offset) : undefined,
				limit: limit ? Number(limit) : undefined,
			});
			res.json(result);
		} catch (e) {
			next(e);
		}
	};

	scanDocument = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const pdfFile = req.files?.pdf as UploadedFile | undefined;
			if (!pdfFile) {
				throw new AppError({
					name: "BAD_REQUEST",
					httpCode: HttpCode.BAD_REQUEST,
					description: "Se requiere un archivo PDF en el campo 'pdf'",
				});
			}

			const result = await this.documentoService.scanDocumento(pdfFile.data);
			res.status(200).json(result);
		} catch (e) {
			next(e);
		}
	};

	scanDocumentBulk = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const rawFiles = req.files?.files;
			if (!rawFiles) {
				throw new AppError({
					name: "BAD_REQUEST",
					httpCode: HttpCode.BAD_REQUEST,
					description: "Se requieren archivos en el campo 'files'",
				});
			}

			const filesArray = Array.isArray(rawFiles) ? rawFiles : [rawFiles];
			const validMimes = ["application/pdf", "image/jpeg"] as const;

			const files = filesArray.map((f) => {
				if (!validMimes.includes(f.mimetype as (typeof validMimes)[number])) {
					throw new AppError({
						name: "BAD_REQUEST",
						httpCode: HttpCode.BAD_REQUEST,
						description: `Formato no válido: ${f.mimetype}. Solo se aceptan PDF o JPEG`,
					});
				}
				return {
					buffer: f.data,
					mimeType: f.mimetype as "application/pdf" | "image/jpeg",
				};
			});

			const result = await this.documentoService.scanDocumentoBulk(files);
			res.status(200).json(result);
		} catch (e) {
			next(e);
		}
	};

	confirmScanDocumentBulk = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const rawFiles = req.files?.files;
			if (!rawFiles) {
				throw new AppError({
					name: "BAD_REQUEST",
					httpCode: HttpCode.BAD_REQUEST,
					description: "Se requieren archivos en el campo 'files'",
				});
			}

			const filesArray = Array.isArray(rawFiles) ? rawFiles : [rawFiles];

			let items: Array<{ index: number; scoutId: string; documentoId: string; fechaPresentacion?: Date }>;
			try {
				items = JSON.parse(req.body.items);
			} catch {
				throw new AppError({
					name: "BAD_REQUEST",
					httpCode: HttpCode.BAD_REQUEST,
					description: "El campo 'items' debe ser un JSON válido",
				});
			}

			if (!Array.isArray(items) || items.length !== filesArray.length) {
				throw new AppError({
					name: "BAD_REQUEST",
					httpCode: HttpCode.BAD_REQUEST,
					description: "La cantidad de archivos debe coincidir con la cantidad de items",
				});
			}

			const validMimes = ["application/pdf", "image/jpeg"] as const;
			const payload = items.map((item, i) => {
				const file = filesArray[i];
				if (!validMimes.includes(file.mimetype as (typeof validMimes)[number])) {
					throw new AppError({
						name: "BAD_REQUEST",
						httpCode: HttpCode.BAD_REQUEST,
						description: `Formato no válido: ${file.mimetype}`,
					});
				}
				return {
					buffer: file.data,
					mimeType: file.mimetype as "application/pdf" | "image/jpeg",
					scoutId: item.scoutId,
					documentoId: item.documentoId,
					fechaPresentacion: item.fechaPresentacion ? new Date(item.fechaPresentacion) : undefined,
				};
			});

			const results = await this.documentoService.confirmScanDocumentoBulk(payload);
			res.status(201).json(results);
		} catch (e) {
			next(e);
		}
	};

	confirmScanDocument = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const pdfFile = req.files?.pdf as UploadedFile | undefined;
			if (!pdfFile) {
				throw new AppError({
					name: "BAD_REQUEST",
					httpCode: HttpCode.BAD_REQUEST,
					description: "Se requiere un archivo PDF en el campo 'pdf'",
				});
			}

			const { scoutId, familiarId, documentoId, fechaPresentacion } = req.body;
			const result = await this.documentoService.confirmScanDocumento({
				scoutId,
				familiarId,
				documentoId,
				fechaPresentacion,
				pdfBuffer: pdfFile.data,
			});

			res.status(201).json(result);
		} catch (e) {
			next(e);
		}
	};
}
