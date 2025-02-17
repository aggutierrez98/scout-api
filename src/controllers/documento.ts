import { Request, Response, NextFunction } from "express";

import { AppError, HttpCode } from "../utils/classes/AppError";
import { DocumentoService } from "../services/documento";
import { unlink } from "fs/promises";

export class DocumentoController {
	public documentoService;

	constructor({ documentoService }: { documentoService: DocumentoService }) {
		this.documentoService = documentoService;
	}

	getItem = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = params;
			const response = await this.documentoService.getDocumento(id);

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
			next(e);
		}
	};

	fillDocument = async ({ body, params }: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = params;
			const responseDocumento = await this.documentoService.fillDocumento(id, body);
			if (!responseDocumento) {
				throw new AppError({
					name: "CREATION_ERROR",
					httpCode: HttpCode.BAD_REQUEST,
					description: "Fallo al crear archivo"
				});
			}

			res.download(responseDocumento, () => {
				unlink(responseDocumento)
			})


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
}
