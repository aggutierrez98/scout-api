import { Request, Response, NextFunction } from "express";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { EntregaService } from "../services/entrega";
import type { ScopingContext } from "../utils/helpers/buildScopingContext";

export class EntregaController {
	public entregaService;

	constructor({ entregaService }: { entregaService: EntregaService }) {
		this.entregaService = entregaService;
	}

	getItem = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = params;
			const response = await this.entregaService.getEntrega(id);

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
			const response = await this.entregaService.getEntregas({
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
			const responseEntrega = await this.entregaService.insertEntrega(body);
			res.send(responseEntrega);
		} catch (e) {
			next(e);
		}
	};

	insertManyItems = async (
		{ body }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const responseEntregas = await this.entregaService.insertEntregas(
				body.entregas,
			);
			res.send(responseEntregas);
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
			const response = await this.entregaService.updateEntrega(id, body);

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

			const response = await this.entregaService.deleteEntrega(id);

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
