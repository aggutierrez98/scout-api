import { Request, Response, NextFunction } from "express";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { EventoService } from "../services/evento";
import { ROLES } from "../types";
import type { ScopingContext } from "../utils/helpers/buildScopingContext";

export class EventoController {
	public eventoService: EventoService;

	constructor({ eventoService }: { eventoService: EventoService }) {
		this.eventoService = eventoService;
	}

	getItems = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { offset, limit, nombre, fechaDesde, fechaHasta } = req.query as Record<string, string>;
			const response = await this.eventoService.getEventos({
				limit: limit ? Number(limit) : undefined,
				offset: offset ? Number(offset) : undefined,
				filters: {
					nombre,
					fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
					fechaHasta: fechaHasta ? new Date(fechaHasta) : undefined,
				},
			});
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	getMisEventos = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const userId = res.locals.currentUser?.uuid;
			if (!userId) throw new AppError({ name: "UNAUTHORIZED", httpCode: HttpCode.UNAUTHORIZED });
			const response = await this.eventoService.getMisEventos(userId);
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	getItem = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const response = await this.eventoService.getEvento(params.id);
			if (!response) throw new AppError({ name: "NOT_FOUND", httpCode: HttpCode.NOT_FOUND });
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	exportNomina = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = res.locals.currentUser;
			if (!currentUser || currentUser.role !== ROLES.ADMINISTRADOR) {
				throw new AppError({
					name: "UNAUTHORIZED",
					httpCode: HttpCode.FORBIDDEN,
					description: "Solo un administrador puede exportar la nómina del evento",
				});
			}

			const format = req.query.pdf === "true" ? "pdf" : "docx";
			const response = await this.eventoService.exportNominaDocumento(req.params.id, { format });
			res.setHeader("Content-Type", response.contentType);
			res.setHeader("Content-Disposition", `attachment; filename="${response.fileName}"`);
			res.send(response.buffer);
		} catch (e) {
			next(e);
		}
	};

	insertItem = async ({ body }: Request, res: Response, next: NextFunction) => {
		try {
			const response = await this.eventoService.insertEvento(body);
			res.status(201).send(response);
		} catch (e) {
			next(e);
		}
	};

	updateItem = async ({ params, body }: Request, res: Response, next: NextFunction) => {
		try {
			const response = await this.eventoService.updateEvento(params.id, body);
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	deleteItem = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const response = await this.eventoService.deleteEvento(params.id);
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	addParticipantes = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const scopingContext: ScopingContext = res.locals.scopingContext
			const response = await this.eventoService.addParticipantes(req.params.id, req.body, scopingContext);
			res.status(201).send(response);
		} catch (e) {
			next(e);
		}
	};

	removeParticipante = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const response = await this.eventoService.removeParticipante(params.id, params.participanteId);
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	removeAllParticipantes = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const response = await this.eventoService.removeAllParticipantes(params.id);
			res.send(response);
		} catch (e) {
			next(e);
		}
	};
}
