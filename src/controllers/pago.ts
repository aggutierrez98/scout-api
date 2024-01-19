import { Request, Response, NextFunction } from "express";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { PagoService } from "../services/pago";

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
}
