import { Request, Response, NextFunction } from "express";
import { UploadedFile } from "express-fileupload";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { PagoService } from "../services/pago";
import type { ScopingContext } from "../utils/helpers/buildScopingContext";
import { ROLES, RolesType } from "../types";
import { ServicioReglasPago } from "../services/servicioReglasPago";
import { ServicioObligacionesPago } from "../services/servicioObligacionesPago";
import { ServicioCondonacionPago } from "../services/servicioCondonacionPago";
import { prismaClient } from "../utils/lib/prisma-client";

const ROLES_ALTOS: RolesType[] = [
	ROLES.JEFE_GRUPO,
	ROLES.SUBJEFE_GRUPO,
	ROLES.ADMINISTRADOR,
];

export class PagoController {
	public pagoService;
	private servicioReglasPago;
	private servicioObligacionesPago;
	private servicioCondonacionPago;

	constructor({ pagoService }: { pagoService: PagoService }) {
		this.pagoService = pagoService;
		this.servicioReglasPago = new ServicioReglasPago();
		this.servicioObligacionesPago = new ServicioObligacionesPago();
		this.servicioCondonacionPago = new ServicioCondonacionPago();
	}

	private getCurrentUser = (res: Response) => {
		const currentUser = res.locals.currentUser;
		if (!currentUser) {
			throw new AppError({
				name: "UNAUTHENTICATED",
				httpCode: HttpCode.UNAUTHORIZED,
				description: "Debes estar autenticado",
			});
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

	getItem = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const { id } = params;
			const response = await this.pagoService.getPago(id);

			if (!response) {
				throw new AppError({
					name: "NOT_FOUND",
					httpCode: HttpCode.NOT_FOUND,
				});
			}

			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	getItems = async (req: Request, res: Response, next: NextFunction) => {
		const { offset, limit, ...filters } = req.query;

		const scopingContext: ScopingContext = res.locals.scopingContext;
		if (scopingContext.scope === "RAMA" && scopingContext.rama) {
			(filters as any).ramas = [scopingContext.rama];
		} else if (scopingContext.scope === "FAMILIAR" && scopingContext.familiarId) {
			(filters as any).familiarId = scopingContext.familiarId;
		}

		try {
			const response = await this.pagoService.getPagos({
				limit: limit ? Number(limit) : undefined,
				offset: offset ? Number(offset) : undefined,
				filters,
			});
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	insertItem = async ({ body }: Request, res: Response, next: NextFunction) => {
		try {
			const responsePago = await this.pagoService.insertPago(body);
			res.send(responsePago);
		} catch (e) {
			next(e);
		}
	};

	updateItem = async (
		{ params, body }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const { id } = params;
			const response = await this.pagoService.updatePago(id, body);

			if (!response) {
				throw new AppError({
					name: "NOT_FOUND",
					httpCode: HttpCode.NOT_FOUND,
				});
			}

			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	deleteItem = async (
		{ params }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const { id } = params;

			const response = await this.pagoService.deletePago(id);

			if (!response) {
				throw new AppError({
					name: "NOT_FOUND",
					httpCode: HttpCode.NOT_FOUND,
				});
			}

			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	deleteManyItems = async (
		{ body }: Request,
		res: Response,
		next: NextFunction,
	) => {
		try {
			const response = await this.pagoService.deletePagos(body.ids);
			res.send(response);
		} catch (e) {
			next(e);
		}
	};

	importItems = async (req: Request, res: Response, next: NextFunction) => {
		try {
			if (!req.files?.csv) {
				throw new AppError({
					name: "CSV_REQUIRED",
					description: "Se requiere un archivo CSV en el campo 'csv'",
					httpCode: HttpCode.BAD_REQUEST,
				});
			}

			const csvFile = Array.isArray(req.files.csv)
				? (req.files.csv[0] as UploadedFile)
				: (req.files.csv as UploadedFile);

			const result = await this.pagoService.importPagos(csvFile.data);
			res.status(201).json(result);
		} catch (e) {
			next(e);
		}
	};

	getReglasActiva = async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const reglas = await this.servicioReglasPago.obtenerReglaActiva();
			res.send(reglas);
		} catch (e) {
			next(e);
		}
	};

	crearReglas = async ({ body }: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = this.getCurrentUser(res);
			this.requireRoles(currentUser.role, ROLES_ALTOS);
			const reglas = await this.servicioReglasPago.crearBorradorReglas(body);
			res.status(201).send(reglas);
		} catch (e) {
			next(e);
		}
	};

	actualizarReglas = async ({ params, body }: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = this.getCurrentUser(res);
			this.requireRoles(currentUser.role, ROLES_ALTOS);
			const reglas = await this.servicioReglasPago.actualizarReglas(params.id, body);
			res.send(reglas);
		} catch (e) {
			next(e);
		}
	};

	activarReglas = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = this.getCurrentUser(res);
			this.requireRoles(currentUser.role, ROLES_ALTOS);
			const reglas = await this.servicioReglasPago.activarReglas(params.id);
			res.send(reglas);
		} catch (e) {
			next(e);
		}
	};

	getPendientes = async ({ query }: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = this.getCurrentUser(res);
			const pendientes = await this.servicioObligacionesPago.listarPendientes({
				user: currentUser,
				filters: query,
			});
			res.send(pendientes);
		} catch (e) {
			next(e);
		}
	};

	getPendiente = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = this.getCurrentUser(res);
			const pendiente = await this.servicioObligacionesPago.obtenerPendiente({
				user: currentUser,
				obligacionId: params.id,
			});
			if (!pendiente) {
				throw new AppError({
					name: "NOT_FOUND",
					httpCode: HttpCode.NOT_FOUND,
					description: "No existe el pendiente solicitado",
				});
			}
			res.send(pendiente);
		} catch (e) {
			next(e);
		}
	};

	perdonarPendiente = async ({ params, body }: Request, res: Response, next: NextFunction) => {
		try {
			const currentUser = this.getCurrentUser(res);
			this.requireRoles(currentUser.role, ROLES_ALTOS);
			const result = await this.servicioCondonacionPago.perdonarObligacion({
				obligacionId: params.id,
				input: body,
				userId: currentUser.id,
			});
			res.status(201).send(result);
		} catch (e) {
			next(e);
		}
	};

	// Endpoint service-to-service: devuelve obligaciones pendientes de un scout
	// sin RBAC de usuario. Sólo accesible con x-api-key.
	getPendientesPorScout = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const pendientes = await this.servicioObligacionesPago.listarPendientesPorScout(params.scoutId);
			res.send(pendientes);
		} catch (e) {
			next(e);
		}
	};

	getPrimerCicloScouts = async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const user = this.getCurrentUser(res);
			this.requireRoles(user.role, ROLES_ALTOS);

			const scouts = await (prismaClient as any).scout.findMany({
				where: { primerCicloAfiliado: true, estado: { not: "INACTIVO" } },
				select: { uuid: true, nombre: true, apellido: true, rama: true, funcion: true },
				orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
			});

			res.json(scouts.map((s: any) => ({
				id: s.uuid,
				nombre: s.nombre,
				apellido: s.apellido,
				rama: s.rama ?? null,
				funcion: s.funcion ?? null,
			})));
		} catch (e) {
			next(e);
		}
	};

	addScoutPrimerCiclo = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const user = this.getCurrentUser(res);
			this.requireRoles(user.role, ROLES_ALTOS);
			const { scoutId } = params;

			await (prismaClient as any).scout.update({
				where: { uuid: scoutId },
				data: { primerCicloAfiliado: true },
			});

			const cicloActivo = await (prismaClient as any).cicloReglasPago.findFirst({
				where: { activo: true, exencionPrimerCicloHabilitada: true },
				select: { uuid: true },
			});
			if (cicloActivo) {
				await this.servicioObligacionesPago.generarObligacionesCiclo(cicloActivo.uuid, { forzarRecrear: true });
			}

			res.json({ scoutId, primerCicloAfiliado: true });
		} catch (e) {
			next(e);
		}
	};

	removeScoutPrimerCiclo = async ({ params }: Request, res: Response, next: NextFunction) => {
		try {
			const user = this.getCurrentUser(res);
			this.requireRoles(user.role, ROLES_ALTOS);
			const { scoutId } = params;

			await (prismaClient as any).scout.update({
				where: { uuid: scoutId },
				data: { primerCicloAfiliado: false },
			});

			const cicloActivo = await (prismaClient as any).cicloReglasPago.findFirst({
				where: { activo: true, exencionPrimerCicloHabilitada: true },
				select: { uuid: true },
			});
			if (cicloActivo) {
				await this.servicioObligacionesPago.generarObligacionesCiclo(cicloActivo.uuid, { forzarRecrear: true });
			}

			res.json({ scoutId, primerCicloAfiliado: false });
		} catch (e) {
			next(e);
		}
	};
}
