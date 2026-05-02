import { Request, Response, NextFunction } from "express";

import { AppError, HttpCode } from "../utils/classes/AppError";
import { FamiliarService } from "../services/familiar";
import type { ScopingContext } from "../utils/helpers/buildScopingContext";

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
		const { offset, limit, select, ...filters } = req.query;

		const scopingContext: ScopingContext = res.locals.scopingContext
		if (scopingContext.scope === 'RAMA' && scopingContext.rama) {
			(filters as any).ramaFilter = scopingContext.rama
		} else if (scopingContext.scope === 'FAMILIAR' && scopingContext.familiarId) {
			(filters as any).familiarUuid = scopingContext.familiarId
		}

		const selectedFields = select?.toString().split(",").reduce((acc, field) => ({ ...acc, [`${field}`]: true }), {})

		try {
			const response = await this.familiarService.getFamiliares({
				limit: limit ? Number(limit) : undefined,
				offset: offset ? Number(offset) : undefined,
				filters,
				select: selectedFields
			});
			res.send(response);
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

	getByDni = async (
		{ params }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const { dni } = params;
			const response = await this.familiarService.findByDni(dni);

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

	getByTelefono = async (
		{ params }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const { telefono } = params;
			const response = await this.familiarService.findByTelefono(telefono);

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

	getByNombre = async (
		{ params }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const { nombre } = params;
			const response = await this.familiarService.findByNombre(nombre);

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

	getTelefonos = async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const telefonos = await this.familiarService.getTelefonos();
			res.send({ telefonos });
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
