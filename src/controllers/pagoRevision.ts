import { Request, Response, NextFunction } from "express";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { ServicioPagoRevision } from "../services/pagoRevision";
import { ROLES, RolesType } from "../types";

const ROLES_ALTOS: RolesType[] = [
  ROLES.JEFE_GRUPO,
  ROLES.SUBJEFE_GRUPO,
  ROLES.ADMINISTRADOR,
];

export class PagoRevisionController {
  private servicio = new ServicioPagoRevision();

  private requireRoles = (role: RolesType, roles: RolesType[]) => {
    if (!roles.includes(role)) {
      throw new AppError({
        name: "FORBIDDEN",
        httpCode: HttpCode.FORBIDDEN,
        description: "No tenés permisos para ejecutar esta acción",
      });
    }
  };

  listarPendientes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = res.locals.currentUser;
      if (!currentUser) {
        throw new AppError({ name: "UNAUTHENTICATED", httpCode: HttpCode.UNAUTHORIZED });
      }
      this.requireRoles(currentUser.role, ROLES_ALTOS);

      const { offset, limit, tipoConflicto } = req.query;
      const result = await this.servicio.listarPendientes({
        offset: offset ? Number(offset) : undefined,
        limit: limit ? Number(limit) : undefined,
        tipoConflicto: tipoConflicto as any,
      });
      res.json(result);
    } catch (e) {
      next(e);
    }
  };

  obtenerRevision = async ({ params }: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = res.locals.currentUser;
      if (!currentUser) {
        throw new AppError({ name: "UNAUTHENTICATED", httpCode: HttpCode.UNAUTHORIZED });
      }
      this.requireRoles(currentUser.role, ROLES_ALTOS);

      const item = await this.servicio.obtenerRevision(params.id);
      if (!item) {
        throw new AppError({ name: "NOT_FOUND", httpCode: HttpCode.NOT_FOUND });
      }
      res.json(item);
    } catch (e) {
      next(e);
    }
  };

  resolverManualmente = async ({ params, body }: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = res.locals.currentUser;
      if (!currentUser) {
        throw new AppError({ name: "UNAUTHENTICATED", httpCode: HttpCode.UNAUTHORIZED });
      }
      this.requireRoles(currentUser.role, ROLES_ALTOS);

      const { scoutId } = body;
      if (!scoutId) {
        throw new AppError({
          name: "SCOUT_ID_REQUERIDO",
          httpCode: HttpCode.BAD_REQUEST,
          description: "Se requiere el campo scoutId para resolver la revisión",
        });
      }

      const result = await this.servicio.resolverManualmente({
        revisionId: params.id,
        scoutId,
        userId: currentUser.id,
      });
      res.json(result);
    } catch (e) {
      next(e);
    }
  };

  aceptarRevision = async ({ params }: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = res.locals.currentUser;
      if (!currentUser) throw new AppError({ name: "UNAUTHENTICATED", httpCode: HttpCode.UNAUTHORIZED });
      this.requireRoles(currentUser.role, ROLES_ALTOS);
      const result = await this.servicio.aceptarRevision({ revisionId: params.id, userId: currentUser.id });
      res.json(result);
    } catch (e) {
      next(e);
    }
  };

  rechazarRevision = async ({ params }: Request, res: Response, next: NextFunction) => {
    try {
      const currentUser = res.locals.currentUser;
      if (!currentUser) throw new AppError({ name: "UNAUTHENTICATED", httpCode: HttpCode.UNAUTHORIZED });
      this.requireRoles(currentUser.role, ROLES_ALTOS);
      const result = await this.servicio.rechazarRevision({ revisionId: params.id, userId: currentUser.id });
      res.json(result);
    } catch (e) {
      next(e);
    }
  };
}
