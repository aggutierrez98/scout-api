import crypto from "crypto";
import { NextFunction, Response, Request } from "express";
import { AppError, HttpCode } from "../utils";

/**
 * Middleware de autenticación service-to-service.
 * Valida el header `x-api-key` contra la variable de entorno `SERVICE_API_KEY`
 * usando una comparación timing-safe.
 */
export const serviceAuth = (req: Request, res: Response, next: NextFunction) => {
	try {
		const serviceApiKey = process.env.SERVICE_API_KEY;

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
