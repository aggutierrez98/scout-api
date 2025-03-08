import { Request, Response, NextFunction } from "express";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { DocumentoService } from "../services/documento";

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

			const responseDocumentoFilled = await this.documentoService.fillDocumento({ ...req.body, retiroData: JSON.parse(req.body.retiroData), signature });
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

			return res.send({
				msg: "Creado exitosamente",
				data: responseDocumento
			})

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
}
