import { NextFunction, Response, Request } from "express";
import { checkSession } from "./session";
import { serviceAuth } from "./serviceAuth";

/**
 * Middleware dual: si viene el header `x-api-key`, se valida como servicio
 * (service-to-service). Caso contrario, se delega al flujo JWT tradicional
 * (`checkSession`). Se usa en endpoints compartidos por el flujo de usuarios
 * autenticados y el flujo de importación desde cruz-del-sur.
 */
export const authOrService = (req: Request, res: Response, next: NextFunction) => {
	if (req.headers["x-api-key"]) {
		return serviceAuth(req, res, next);
	}
	return checkSession(req, res, next);
};
