import { Request, Response, NextFunction } from "express";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { IUserData, OrderToGetScouts } from "../types";
import { ScoutService } from "../services/scout";
import { UploadedFile } from "express-fileupload";
import type { ScopingContext } from "../utils/helpers/buildScopingContext";

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
			const { offset, limit, orderBy, select, ...filters } = req.query;

			const scopingContext: ScopingContext = res.locals.scopingContext
			if (scopingContext.scope === 'RAMA' && scopingContext.rama) {
				filters.ramas = [scopingContext.rama] as any
			} else if (scopingContext.scope === 'FAMILIAR' && scopingContext.familiarId) {
				filters.familiarId = scopingContext.familiarId
			}

			const selectedFields = select?.toString().split(",").reduce((acc, field) => ({ ...acc, [`${field}`]: true }), {})

			const response = await this.scoutService.getScouts({
				limit: limit ? Number(limit) : undefined,
				offset: offset ? Number(offset) : undefined,
				orderBy: orderBy as OrderToGetScouts,
				filters,
				select: selectedFields
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

	getByDni = async (
		{ params }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const { dni } = params;
			const response = await this.scoutService.findByDni(dni);

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

	importItems = async (
		{ files }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const nomina = files?.nomina;
			const result = await this.scoutService.importScouts(nomina as UploadedFile);
			return res.json(result);
		} catch (e) {
			next(e);
		}
	};
}
