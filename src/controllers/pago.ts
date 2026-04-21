import { Request, Response, NextFunction } from "express";
import { UploadedFile } from "express-fileupload";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { PagoService } from "../services/pago";
import type { ScopingContext } from "../utils/helpers/buildScopingContext";

export class PagoController {
	public pagoService;

	constructor({ pagoService }: { pagoService: PagoService }) {
		this.pagoService = pagoService;
	}

	getItem = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = params;
			const response = await this.pagoService.getPago(id);

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
			const response = await this.pagoService.getPagos({
				limit: limit ? Number(limit) : undefined,
				offset: offset ? Number(offset) : undefined,
				filters,
			});
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	insertItem = async ({ body }: Request, res: Response, next: NextFunction) => {
		try {
			const responsePago = await this.pagoService.insertPago(body);
			res.send(responsePago);
		} catch (e) {
			next(e);
		}
	};

	updateItem = async (
		{ params, body }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const { id } = params;
			const response = await this.pagoService.updatePago(id, body);

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

	deleteItem = async (
		{ params }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const { id } = params;

			const response = await this.pagoService.deletePago(id);

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

	importItems = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.files?.csv) {
				throw new AppError({
					name: "CSV_REQUIRED",
					description: "Se requiere un archivo CSV en el campo 'csv'",
					httpCode: HttpCode.BAD_REQUEST,
				});
			}

			const csvFile = Array.isArray(req.files.csv)
				? (req.files.csv[0] as UploadedFile)
				: (req.files.csv as UploadedFile);

			const result = await this.pagoService.importPagos(csvFile.data);
			res.status(201).json(result);
		} catch (e) {
			next(e);
		}
	};
}
