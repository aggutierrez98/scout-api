import { Request, Response, NextFunction } from "express";
import { WebhookService } from "../services/webhook";

export class WebhookController {
	public webhookService;

	constructor({ webhookService }: { webhookService: WebhookService }) {
		this.webhookService = webhookService;
	}

	procesarComprobante = async ({ body }: Request, res: Response, next: NextFunction) => {
		try {
			const { datos } = body;

			// Si el OCR determinó que no es un comprobante, no es un error
			if (!datos.es_comprobante) {
				res.status(200).json({ message: "No es un comprobante, ignorado" });
				return;
			}

			const result = await this.webhookService.procesarComprobante(datos);
			res.status(201).json(result);
		} catch (e) {
			next(e);
		}
	};
}
