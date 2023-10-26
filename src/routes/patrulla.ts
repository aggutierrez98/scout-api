import { Router } from "express";
import {
	cacheMiddleware,
	checkSession,
	cleanCacheMiddleware
} from "../middlewares"
	;
import { PatrullaController } from "../controllers/patrulla";
import { validate } from "../middlewares/validate";
import { PatrullaService } from "../services/patrulla";
import {
	DeletePatrullaSchema,
	GetPatrullaSchema,
	GetPatrullasSchema,
	PostPatrullaSchema,
	PutPatrullaSchema,
} from "../validators";

export const createPatrullaRouter = (patrullaService: PatrullaService) => {
	const router = Router();
	const patrullaController = new PatrullaController({ patrullaService });

	router.get("/",
		checkSession,
		validate(GetPatrullasSchema),
		patrullaController.getItems
	);
	router.get(
		"/:id",
		validate(GetPatrullaSchema),
		cacheMiddleware,
		patrullaController.getItem,
	);
	router.post("/",
		checkSession,
		validate(PostPatrullaSchema),
		patrullaController.insertItem
	);
	router.put(
		"/:id",
		checkSession,
		validate(PutPatrullaSchema),
		cleanCacheMiddleware,
		patrullaController.updateItem,
	);
	router.delete(
		"/:id",
		checkSession,
		validate(DeletePatrullaSchema),
		cleanCacheMiddleware,
		patrullaController.deleteItem,
	);

	return router;
};
