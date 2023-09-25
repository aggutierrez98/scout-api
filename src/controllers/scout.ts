import { Request, Response, NextFunction } from "express";

import { AppError, HttpCode } from "../utils/classes/AppError";
import { OrderToGetScouts } from "../types";
import { ScoutService } from "../services/scout";

export class ScoutController {
	public scoutService;

	constructor({ scoutService }: { scoutService: ScoutService }) {
		this.scoutService = scoutService;
	}

	getItem = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = params;
			const response = await this.scoutService.getScout(id);

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
		try {
			const { offset, limit, orderBy, ...filters } = req.query;

			const response = await this.scoutService.getScouts({
				limit: limit ? Number(limit) : undefined,
				offset: offset ? Number(offset) : undefined,
				orderBy: orderBy as OrderToGetScouts,
				filters,
			});
			res.send(response);
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
			const response = await this.scoutService.updateScout(id, body);

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

	insertItem = async ({ body }: Request, res: Response, next: NextFunction) => {
		try {
			const responseScout = await this.scoutService.insertScout(body);
			res.send(responseScout);
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
			const response = await this.scoutService.deleteScout(id);

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
