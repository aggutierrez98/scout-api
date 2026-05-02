import type { Request, Response, NextFunction } from "express";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { ServicioBecaSAAC } from "../services/servicioBecaSAAC";
import { ROLES, RolesType } from "../types";

const ROLES_ALTOS: RolesType[] = [
	ROLES.JEFE_GRUPO,
	ROLES.SUBJEFE_GRUPO,
	ROLES.ADMINISTRADOR,
];

export class BecaSAACController {
	private servicio = new ServicioBecaSAAC();

	private getCurrentUser = (res: Response) => {
		const currentUser = res.locals.currentUser;
		if (!currentUser) {
			throw new AppError({ name: "UNAUTHENTICATED", httpCode: HttpCode.UNAUTHORIZED, description: "Debes estar autenticado" });
		}
		return currentUser;
	};

	private requireRoles = (role: RolesType, roles: RolesType[]) => {
		if (!roles.includes(role)) {
			throw new AppError({
				name: "FORBIDDEN",
				httpCode: HttpCode.FORBIDDEN,
				description: "No tenés permisos para ejecutar esta acción",
			});
		}
	};

	listar = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { cicloId } = req.params;
			const result = await this.servicio.listarPorCiclo(cicloId);
			res.status(HttpCode.OK).json(result);
		} catch (err) {
			next(err);
		}
	};

	crear = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { cicloId } = req.params;
			const user = this.getCurrentUser(res);
			this.requireRoles(user.role, ROLES_ALTOS);
			const { scoutId, porcentaje, motivo } = req.body;
			const result = await this.servicio.crear({ cicloId, scoutId, porcentaje, motivo, userId: user.uuid });
			res.status(HttpCode.OK).json(result);
		} catch (err) {
			next(err);
		}
	};

	actualizar = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const user = this.getCurrentUser(res);
			this.requireRoles(user.role, ROLES_ALTOS);
			const { id } = req.params;
			const { porcentaje, motivo } = req.body;
			const result = await this.servicio.actualizar({ becaId: id, porcentaje, motivo });
			res.status(HttpCode.OK).json(result);
		} catch (err) {
			next(err);
		}
	};

	eliminar = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const user = this.getCurrentUser(res);
			this.requireRoles(user.role, ROLES_ALTOS);
			const { id } = req.params;
			const result = await this.servicio.eliminar(id);
			res.status(HttpCode.OK).json(result);
		} catch (err) {
			next(err);
		}
	};
}
