import { Request, Response, NextFunction } from "express";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { TipoEventoService } from "../services/tipoEvento";

export class TipoEventoController {
	public tipoEventoService: TipoEventoService;

	constructor({ tipoEventoService }: { tipoEventoService: TipoEventoService }) {
		this.tipoEventoService = tipoEventoService;
	}

	getItems = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { offset, limit } = req.query;
			const response = await this.tipoEventoService.getTiposEvento({
				limit: limit ? Number(limit) : undefined,
				offset: offset ? Number(offset) : undefined,
			});
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	getItem = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const response = await this.tipoEventoService.getTipoEvento(params.id);
			if (!response) throw new AppError({ name: "NOT_FOUND", httpCode: HttpCode.NOT_FOUND });
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	insertItem = async ({ body }: Request, res: Response, next: NextFunction) => {
		try {
			const response = await this.tipoEventoService.insertTipoEvento(body);
			res.status(201).send(response);
		} catch (e) {
			next(e);
		}
	};

	updateItem = async ({ params, body }: Request, res: Response, next: NextFunction) => {
		try {
			const response = await this.tipoEventoService.updateTipoEvento(params.id, body);
			if (!response) throw new AppError({ name: "NOT_FOUND", httpCode: HttpCode.NOT_FOUND });
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	deleteItem = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const response = await this.tipoEventoService.deleteTipoEvento(params.id);
			res.send(response);
		} catch (e) {
			next(e);
		}
	};
}
