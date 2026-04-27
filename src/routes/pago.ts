import { Router } from "express";
import { cacheMiddleware, cleanCacheMiddleware } from "../middlewares";
import { PagoController } from "../controllers/pago";
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

	router.get("/", validate(GetPagosSchema), pagoController.getItems);

	router.get(
		"/reglas/activa",
		validate(GetReglasPagoActivaSchema),
		pagoController.getReglasActiva,
	);
	router.post(
		"/reglas",
		validate(PostReglasPagoSchema),
		cleanCacheMiddleware,
		pagoController.crearReglas,
	);
	router.put(
		"/reglas/:id",
		validate(PutReglasPagoSchema),
		cleanCacheMiddleware,
		pagoController.actualizarReglas,
	);
	router.post(
		"/reglas/:id/activar",
		validate(ActivarReglasPagoSchema),
		cleanCacheMiddleware,
		pagoController.activarReglas,
	);

	router.get(
		"/pendientes",
		validate(GetPendientesPagoSchema),
		pagoController.getPendientes,
	);
	router.get(
		"/pendientes/:id",
		validate(GetPendientePagoDetalleSchema),
		pagoController.getPendiente,
	);
	router.post(
		"/pendientes/:id/perdonar",
		validate(PerdonarPendientePagoSchema),
		cleanCacheMiddleware,
		pagoController.perdonarPendiente,
	);

	router.post("/", validate(PostPagoSchema), pagoController.insertItem);
	router.post("/import", cleanCacheMiddleware, pagoController.importItems);
	router.get("/:id", validate(GetPagoSchema), cacheMiddleware, pagoController.getItem);
	router.put("/:id", validate(PutPagoSchema), cleanCacheMiddleware, pagoController.updateItem);
	router.delete("/:id", validate(DeletePagoSchema), cleanCacheMiddleware, pagoController.deleteItem);

	return router;
}
