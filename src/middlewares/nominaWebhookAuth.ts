import crypto from "crypto";
import { NextFunction, Response, Request } from "express";
import { AppError, HttpCode } from "../utils";

export const nominaWebhookAuth = (req: Request, res: Response, next: NextFunction) => {
	try {
		const webhookSecret = process.env.NOMINA_WEBHOOK_SECRET;

		if (!webhookSecret) {
			throw new AppError({
				name: "NOMINA_WEBHOOK_SECRET_NOT_CONFIGURED",
				description: "Secreto del webhook de nómina no configurado",
				httpCode: HttpCode.UNAUTHORIZED,
			});
		}

		const source = req.headers["x-webhook-source"];
		if (source !== "cruz-del-sur") {
			throw new AppError({
				name: "INVALID_NOMINA_WEBHOOK_SOURCE",
				description: "Fuente de webhook no autorizada",
				httpCode: HttpCode.UNAUTHORIZED,
			});
		}

		const headerSignature = req.headers["x-webhook-secret"] as string | undefined;
		if (!headerSignature) {
			throw new AppError({
				name: "MISSING_NOMINA_WEBHOOK_SECRET",
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
				name: "INVALID_NOMINA_WEBHOOK_SECRET",
				description: "Firma del webhook inválida",
				httpCode: HttpCode.UNAUTHORIZED,
			});
		}

		next();
	} catch (e) {
		next(e);
	}
};
