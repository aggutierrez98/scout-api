import { Router } from "express";
import {
	cacheMiddleware,
	checkSession,
	cleanCacheMiddleware
} from "../middlewares"
	;
import { EquipoController } from "../controllers/equipo";
import { validate } from "../middlewares/validate";
import { EquipoService } from "../services/equipo";
import {
	DeleteEquipoSchema,
	GetEquipoSchema,
	GetEquiposSchema,
	PostEquipoSchema,
	PutEquipoSchema,
} from "../validators";

export default function createEquipoRouter(equipoService: EquipoService) {
	const router = Router();
	const equipoController = new EquipoController({ equipoService });

	router.get("/",
		validate(GetEquiposSchema),
		equipoController.getItems
	);
	router.get(
		"/:id",
		validate(GetEquipoSchema),
		cacheMiddleware,
		equipoController.getItem,
	);
	router.post("/",
		validate(PostEquipoSchema),
		equipoController.insertItem
	);
	router.put(
		"/:id",
		validate(PutEquipoSchema),
		cleanCacheMiddleware,
		equipoController.updateItem,
	);
	router.delete(
		"/:id",
		validate(DeleteEquipoSchema),
		cleanCacheMiddleware,
		equipoController.deleteItem,
	);

	return router;
};
