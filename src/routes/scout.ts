import { Router } from "express";

import { cacheMiddleware, checkSession, cleanCacheMiddleware, serviceAuth, authOrService } from "../middlewares";
import { ScoutController } from "../controllers/scout";
import { ScoutService } from "../services/scout";
import { validate } from "../middlewares/validate";
import {
	DeleteScoutSchema,
	GetScoutSchema,
	GetScoutsSchema,
	ImportScoutsSchema,
	PostScoutSchema,
	PutScoutSchema,
} from "../validators/scout";

export default function createScoutRouter(scoutService: ScoutService) {
	const router = Router();
	const scoutController = new ScoutController({ scoutService });

	// Endpoint service-to-service: autenticación por x-api-key únicamente.
	// Se registra antes de "/:id" para que no sea capturado por esa ruta.
	router.get(
		"/by-dni/:dni",
		serviceAuth,
		scoutController.getByDni,
	);
	router.get("/",
		checkSession,
		validate(GetScoutsSchema),
		scoutController.getItems
	);
	router.get(
		"/:id",
		checkSession,
		validate(GetScoutSchema),
		cacheMiddleware,
		scoutController.getItem,
	);
	// POST scout acepta JWT o x-api-key (flujo user + flujo importación cruz-del-sur).
	router.post("/",
		authOrService,
		validate(PostScoutSchema),
		scoutController.insertItem
	);
	router.post("/import",
		checkSession,
		validate(ImportScoutsSchema),
		scoutController.importItems
	);
	router.put(
		"/:id",
		checkSession,
		validate(PutScoutSchema),
		cleanCacheMiddleware,
		scoutController.updateItem,
	);
	router.delete(
		"/:id",
		checkSession,
		validate(DeleteScoutSchema),
		cleanCacheMiddleware,
		scoutController.deleteItem,
	);

	return router;
};
