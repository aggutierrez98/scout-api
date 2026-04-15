import { Request, Response, NextFunction } from "express";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { NotificacionService } from "../services/notificacion";

export class NotificacionController {
	public notificacionService;

	constructor({ notificacionService }: { notificacionService: NotificacionService }) {
		this.notificacionService = notificacionService;
	}

	getItems = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = res.locals.currentUser;
			const { offset, limit, ...filters } = req.query;

			const response = await this.notificacionService.getNotificaciones(
				currentUser.uuid,
				{
					limit: limit ? Number(limit) : undefined,
					offset: offset ? Number(offset) : undefined,
					filters,
				},
			);
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	insertItem = async ({ body }: Request, res: Response, next: NextFunction) => {
		try {
			const response = await this.notificacionService.crearAviso(body);
			res.status(201).send(response);
		} catch (e) {
			next(e);
		}
	};

	updateItem = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = res.locals.currentUser;
			const { id } = params;

			const response = await this.notificacionService.marcarLeida(id, currentUser.uuid);

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

	updateAllRead = async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = res.locals.currentUser;
			const response = await this.notificacionService.marcarTodasLeidas(currentUser.uuid);
			res.send(response);
		} catch (e) {
			next(e);
		}
	};
}
