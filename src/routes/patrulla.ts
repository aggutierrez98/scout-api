import { Router } from "express";
import { cacheMiddleware, cleanCacheMiddleware } from "../middlewares";
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

	router.get("/", validate(GetPatrullasSchema), patrullaController.getItems);
	router.get(
		"/:id",
		validate(GetPatrullaSchema),
		cacheMiddleware,
		patrullaController.getItem,
	);
	router.post("/", validate(PostPatrullaSchema), patrullaController.insertItem);
	router.put(
		"/:id",
		validate(PutPatrullaSchema),
		cleanCacheMiddleware,
		patrullaController.updateItem,
	);
	router.delete(
		"/:id",
		validate(DeletePatrullaSchema),
		cleanCacheMiddleware,
		patrullaController.deleteItem,
	);

	return router;
};
