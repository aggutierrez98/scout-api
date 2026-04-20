import crypto from "crypto";
import { NextFunction, Response, Request } from "express";
import { AppError, HttpCode } from "../utils";
import { SecretsManager } from "../utils/classes/SecretsManager";

/**
 * Middleware de autenticación service-to-service.
 * Valida el header `x-api-key` contra SERVICE_API_KEY de Infisical
 * usando una comparación timing-safe.
 */
export const serviceAuth = (req: Request, res: Response, next: NextFunction) => {
	try {
		const secrets = SecretsManager.getInstance();
		const serviceApiKey = secrets.isReady() ? secrets.getServiceApiKey() : undefined;

		if (!serviceApiKey) {
			throw new AppError({
				name: "SERVICE_API_KEY_NOT_CONFIGURED",
				description: "Service API key no configurada",
				httpCode: HttpCode.UNAUTHORIZED,
			});
		}

		const headerKey = req.headers["x-api-key"];
		const providedKey = Array.isArray(headerKey) ? headerKey[0] : headerKey;

		if (!providedKey || typeof providedKey !== "string") {
			return res.status(HttpCode.UNAUTHORIZED).json({ error: "Unauthorized" });
		}

		const expectedBuf = new Uint8Array(Buffer.from(serviceApiKey));
		const providedBuf = new Uint8Array(Buffer.from(providedKey));

		if (expectedBuf.length !== providedBuf.length) {
			return res.status(HttpCode.UNAUTHORIZED).json({ error: "Unauthorized" });
		}

		if (!crypto.timingSafeEqual(expectedBuf, providedBuf)) {
			return res.status(HttpCode.UNAUTHORIZED).json({ error: "Unauthorized" });
		}

		next();
	} catch (e) {
		return res.status(HttpCode.UNAUTHORIZED).json({ error: "Unauthorized" });
	}
};
