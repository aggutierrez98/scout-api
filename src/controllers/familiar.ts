import { Request, Response, NextFunction } from "express";

import { AppError, HttpCode } from "../utils/classes/AppError";
import { FamiliarService } from "../services/familiar";

export class FamiliarController {
	public familiarService;

	constructor({ familiarService }: { familiarService: FamiliarService }) {
		this.familiarService = familiarService;
	}

	getItem = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = params;
			const response = await this.familiarService.getFamiliar(id);

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
			try {
				const response = await this.familiarService.getFamiliares({
					limit: limit ? Number(limit) : undefined,
					offset: offset ? Number(offset) : undefined,
					filters,
				});
				res.send(response);
			} catch (e) {
				next(e);
			}

		} catch (e) {
			next(e);
		}
	};

	relateItem = async (
		{ body, params }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const { scoutId, relacion } = body;

			const response = await this.familiarService.relateScoutToFamiliar(
				params.id,
				scoutId,
				relacion,
			);

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

	unrelateItem = async (
		{ body, params }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const { scoutId } = body;

			const response = await this.familiarService.unrelateScoutToFamiliar(
				params.id,
				scoutId,
			);

			// console.log(response)

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

	updateItem = async (
		{ params, body }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const { id } = params;
			const response = await this.familiarService.updateFamiliar(id, body);

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
			const responseFamiliar = await this.familiarService.insertFamiliar(body);
			res.send(responseFamiliar);
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
			const response = await this.familiarService.deleteFamiliar(id);

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
