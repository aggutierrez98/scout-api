import { Router } from "express";
import { cacheMiddleware, cleanCacheMiddleware, checkSession, serviceAuth } from "../middlewares";
import { PagoController } from "../controllers/pago";
import { PagoRevisionController } from "../controllers/pagoRevision";
import { PagoService } from "../services/pago";
import { validate } from "../middlewares/validate";
import {
	ActivarReglasPagoSchema,
	DeletePagoSchema,
	GetPagoSchema,
	GetPagosSchema,
	GetPendientePagoDetalleSchema,
	GetPendientesPagoSchema,
	GetReglasPagoActivaSchema,
	PerdonarPendientePagoSchema,
	PostPagoSchema,
	PostReglasPagoSchema,
	PutPagoSchema,
	PutReglasPagoSchema,
} from "../validators/pago";

export default function createPagoRouter(pagoService: PagoService) {
	const router = Router();
	const pagoController = new PagoController({ pagoService });
	const revisionController = new PagoRevisionController();

	router.get("/", checkSession, validate(GetPagosSchema), pagoController.getItems);

	// ─── Reglas de pago ──────────────────────────────────────────────────────
	router.get("/reglas/activa", checkSession, validate(GetReglasPagoActivaSchema), pagoController.getReglasActiva);
	router.post("/reglas", checkSession, validate(PostReglasPagoSchema), cleanCacheMiddleware, pagoController.crearReglas);
	router.put("/reglas/:id", checkSession, validate(PutReglasPagoSchema), cleanCacheMiddleware, pagoController.actualizarReglas);
	router.post("/reglas/:id/activar", checkSession, validate(ActivarReglasPagoSchema), cleanCacheMiddleware, pagoController.activarReglas);

	// ─── Obligaciones pendientes ──────────────────────────────────────────────
	// Service-to-service: sin RBAC, solo x-api-key. DEBE ir antes de /:id.
	router.get("/pendientes/por-scout/:scoutId", serviceAuth, pagoController.getPendientesPorScout);
	router.get("/pendientes", checkSession, validate(GetPendientesPagoSchema), pagoController.getPendientes);
	router.get("/pendientes/:id", checkSession, validate(GetPendientePagoDetalleSchema), pagoController.getPendiente);
	router.post("/pendientes/:id/perdonar", checkSession, validate(PerdonarPendientePagoSchema), cleanCacheMiddleware, pagoController.perdonarPendiente);

	// ─── Revisión de pagos con conflicto ─────────────────────────────────────
	router.get("/revision", checkSession, revisionController.listarPendientes);
	router.get("/revision/:id", checkSession, revisionController.obtenerRevision);
	router.post("/revision/:id/resolver", checkSession, cleanCacheMiddleware, revisionController.resolverManualmente);
	router.post("/revision/:id/aceptar", checkSession, cleanCacheMiddleware, revisionController.aceptarRevision);
	router.post("/revision/:id/rechazar", checkSession, cleanCacheMiddleware, revisionController.rechazarRevision);


	// ─── CRUD pagos ───────────────────────────────────────────────────────────
	router.post("/", checkSession, validate(PostPagoSchema), pagoController.insertItem);
	router.post("/import", checkSession, cleanCacheMiddleware, pagoController.importItems);
	router.get("/:id", checkSession, validate(GetPagoSchema), cacheMiddleware, pagoController.getItem);
	router.put("/:id", checkSession, validate(PutPagoSchema), cleanCacheMiddleware, pagoController.updateItem);
	router.delete("/:id", checkSession, validate(DeletePagoSchema), cleanCacheMiddleware, pagoController.deleteItem);

	return router;
}

