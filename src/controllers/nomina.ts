import { Request, Response, NextFunction } from "express";
import { NominaService } from "../services/nomina";

export class NominaController {
	public nominaService;

	constructor({ nominaService }: { nominaService: NominaService }) {
		this.nominaService = nominaService;
	}

	/**
	 * POST /api/nomina/sync
	 *
	 * Forma 1 — On-demand pull: solicita la nómina actual a cruz-del-sur y
	 * sincroniza los estados de los scouts en nuestro sistema.
	 * Requiere sesión con permiso ADMINISTRADOR.
	 */
	syncOnDemand = async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const result = await this.nominaService.pullAndSync();
			res.status(200).json(result);
		} catch (e) {
			next(e);
		}
	};

	/**
	 * POST /api/webhook/nomina
	 *
	 * Forma 2 — Recepción de webhook: cruz-del-sur envía la nómina diaria
	 * como push. Autenticado por HMAC-SHA256 (nominaWebhookAuth middleware).
	 */
	recibirWebhook = async ({ body }: Request, res: Response, next: NextFunction) => {
		try {
			const { data } = body;
			const result = await this.nominaService.syncNomina(data);
			res.status(200).json(result);
		} catch (e) {
			next(e);
		}
	};
}
