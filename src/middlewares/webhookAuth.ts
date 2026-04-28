import crypto from "crypto";
import { NextFunction, Response, Request } from "express";
import { AppError, HttpCode } from "../utils";
import { SecretsManager } from "../utils/classes/SecretsManager";

export const webhookAuth = (req: Request, res: Response, next: NextFunction) => {
	try {
		const secrets = SecretsManager.getInstance();
		const webhookSecret = secrets.isReady() ? secrets.getComprobantesWebhookSecret() : undefined;

		if (!webhookSecret) {
			throw new AppError({
				name: "WEBHOOK_SECRET_NOT_CONFIGURED",
				description: "Webhook secret no configurado",
				httpCode: HttpCode.UNAUTHORIZED,
			});
		}

		const source = req.headers["x-webhook-source"];
		if (source !== "whatsapp-comprobantes") {
			throw new AppError({
				name: "INVALID_WEBHOOK_SOURCE",
				description: "Fuente de webhook no autorizada",
				httpCode: HttpCode.UNAUTHORIZED,
			});
		}

		const headerSignature = req.headers["x-webhook-secret"] as string | undefined;
		if (!headerSignature) {
			throw new AppError({
				name: "MISSING_WEBHOOK_SECRET",
				description: "Firma del webhook ausente",
				httpCode: HttpCode.UNAUTHORIZED,
			});
		}

		const expectedSignature = crypto
			.createHmac("sha256", webhookSecret)
			.update(JSON.stringify(req.body))
			.digest("hex");

		if (headerSignature !== expectedSignature) {
			throw new AppError({
				name: "INVALID_WEBHOOK_SECRET",
				description: "Firma del webhook inválida",
				httpCode: HttpCode.UNAUTHORIZED,
			});
		}

		next();
	} catch (e) {
		next(e);
	}
};
