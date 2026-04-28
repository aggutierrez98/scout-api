import { Router } from "express";

import { cacheMiddleware, checkSession, cleanCacheMiddleware, serviceAuth, authOrService } from "../middlewares";
import { FamiliarController } from "../controllers/familiar";
import { FamiliarService } from "../services/familiar";
import { validate } from "../middlewares/validate";
import {
	DeleteFamiliarSchema,
	GetFamiliarSchema,
	PostFamiliarSchema,
	PutFamiliarSchema,
	UnrelateFamiliarSchema,
	RelateFamiliarParams,
	GetFamiliaresSchema,
} from "../validators/familiar";

export default function createFamiliarRouter(familiarService: FamiliarService) {
	const router = Router();
	const familiarController = new FamiliarController({ familiarService });

	// Endpoints service-to-service: autenticación por x-api-key únicamente.
	// Se registran antes de "/:id" para evitar ser capturados por esa ruta.
	router.get(
		"/by-dni/:dni",
		serviceAuth,
		familiarController.getByDni,
	);
	router.get(
		"/by-telefono/:telefono",
		serviceAuth,
		familiarController.getByTelefono,
	);
	router.get(
		"/by-nombre/:nombre",
		serviceAuth,
		familiarController.getByNombre,
	);
	router.get(
		"/",
		checkSession,
		validate(GetFamiliaresSchema),
		cacheMiddleware,
		familiarController.getItems,
	);
	router.get(
		"/:id",
		checkSession,
		validate(GetFamiliarSchema),
		cacheMiddleware,
		familiarController.getItem,
	);

	// POST familiar acepta JWT o x-api-key (flujo user + importación cruz-del-sur).
	router.post("/",
		authOrService,
		validate(PostFamiliarSchema),
		familiarController.insertItem
	);

	// relate acepta JWT o x-api-key por el mismo motivo.
	router.put(
		"/relate/:id",
		authOrService,
		validate(RelateFamiliarParams),
		familiarController.relateItem,
	);

	router.put(
		"/unrelate/:id",
		checkSession,
		validate(UnrelateFamiliarSchema),
		familiarController.unrelateItem,
	);

	router.put(
		"/:id",
		checkSession,
		validate(PutFamiliarSchema),
		cleanCacheMiddleware,
		familiarController.updateItem,
	);

	router.delete(
		"/:id",
		checkSession,
		validate(DeleteFamiliarSchema),
		cleanCacheMiddleware,
		familiarController.deleteItem,
	);

	return router;
};
