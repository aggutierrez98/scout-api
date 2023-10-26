import { Router } from "express";

import { cacheMiddleware, checkSession, cleanCacheMiddleware } from "../middlewares";
import { ScoutController } from "../controllers/scout";
import { ScoutService } from "../services/scout";
import { validate } from "../middlewares/validate";
import {
	DeleteScoutSchema,
	GetScoutSchema,
	GetScoutsSchema,
	PostScoutSchema,
	PutScoutSchema,
} from "../validators/scout";

export const createScoutRouter = (scoutService: ScoutService) => {
	const router = Router();
	const scoutController = new ScoutController({ scoutService });

	router.get("/",
		checkSession,
		validate(GetScoutsSchema),
		scoutController.getItems
	);
	router.get("/all", checkSession, scoutController.getAllItems);
	router.get(
		"/:id",
		checkSession,
		validate(GetScoutSchema),
		cacheMiddleware,
		scoutController.getItem,
	);
	router.post("/", checkSession, validate(PostScoutSchema), scoutController.insertItem);
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
