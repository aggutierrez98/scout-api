import { NextFunction, Response, Request } from "express";
import { verifyToken } from "../utils/lib/jwt.util";
import { JwtPayload } from "jsonwebtoken";
import { AppError, HttpCode } from "../utils";
import { AuthService } from "../services/auth";
import { validatePermissions, HTTPMethods } from '../utils/helpers/validatePermissions';
import { RolesType } from "../types";

interface RequestExt extends Request {
	user?: JwtPayload | { id: string };
}

export const checkSession = async (req: RequestExt, res: Response, next: NextFunction) => {
	try {
		const jwtByUser = req.headers.authorization?.split("Bearer ")[1];

		if (!jwtByUser) {
			throw new AppError({
				name: "UNAUTHENTICATED",
				description: "Debes estar autorizado",
				httpCode: HttpCode.UNAUTHORIZED,
			});
		}
		const jwt = jwtByUser.split(" ").pop();

		let isUser;
		try {
			isUser = verifyToken(`${jwt}`) as { id: string };

		} catch (error) {
			throw new AppError({
				name: "INVALID_TOKEN",
				description: "Token expirado",
				httpCode: HttpCode.UNAUTHORIZED,
			});
		}

		if (!isUser) {
			throw new AppError({
				name: "INVALID_TOKEN",
				description: "Debes estar autorizado",
				httpCode: HttpCode.UNAUTHORIZED,
			});

		} else {
			const resource = req.baseUrl.split("api/")[1];
			const method = req.method as HTTPMethods
			const authService = new AuthService()
			const user = await authService.getUser({ userId: isUser.id })!
			const isAllowed = validatePermissions({ method, resource, userRole: (user?.role as RolesType) })

			if (!isAllowed) {
				throw new AppError({
					name: "UNAUTHORIZED",
					description: "Sin permisos para acceder a la seccion",
					httpCode: HttpCode.UNAUTHORIZED,
				});
			}

			res.locals.currentUser = user
			next();
		}

	} catch (e) {
		next(e)
	}
}