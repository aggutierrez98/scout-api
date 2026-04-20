import { Request, Response, NextFunction } from "express";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { NotificacionService } from "../services/notificacion";
import { PushTokenService } from "../services/pushToken";

export class NotificacionController {
	public notificacionService;
	private pushTokenService: PushTokenService;

	constructor({ notificacionService }: { notificacionService: NotificacionService }) {
		this.notificacionService = notificacionService;
		this.pushTokenService = new PushTokenService();
	}

	getItems = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = res.locals.currentUser;
			const { offset, limit, ...filters } = req.query;

			const response = await this.notificacionService.getNotificaciones(
				currentUser.id,
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

	getItem = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = res.locals.currentUser;
			const { id } = params;

			const response = await this.notificacionService.findNotificacion(id, currentUser.id);

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

	updateItem = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = res.locals.currentUser;
			const { id } = params;

			const response = await this.notificacionService.marcarLeida(id, currentUser.id);

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
			const response = await this.notificacionService.marcarTodasLeidas(currentUser.id);
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	getAvisos = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = res.locals.currentUser;
			if (currentUser.role !== "ADMINISTRADOR") {
				throw new AppError({ name: "UNAUTHORIZED", httpCode: HttpCode.FORBIDDEN });
			}
			const { offset, limit, tipo, fechaDesde, fechaHasta, userId } = req.query as Record<string, string>;
			const response = await this.notificacionService.listAvisos({
				limit: limit ? Number(limit) : 10,
				offset: offset ? Number(offset) : 0,
				filters: { tipo, fechaDesde, fechaHasta, userId },
			});
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	getAvisoDestinatarios = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = res.locals.currentUser;
			if (currentUser.role !== "ADMINISTRADOR") {
				throw new AppError({ name: "UNAUTHORIZED", httpCode: HttpCode.FORBIDDEN });
			}
			const { id } = req.params;
			const response = await this.notificacionService.getAvisoDestinatarios(id);
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	registerPushToken = async ({ body }: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = res.locals.currentUser;
			await this.pushTokenService.registrarToken(currentUser.id, body);
			res.status(201).send({ ok: true });
		} catch (e) {
			next(e);
		}
	};

	unregisterPushToken = async ({ body }: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = res.locals.currentUser;
			await this.pushTokenService.desregistrarToken(currentUser.id, body.platform, body.token);
			res.send({ ok: true });
		} catch (e) {
			next(e);
		}
	};
}
