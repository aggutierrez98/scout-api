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

export default function createScoutRouter(scoutService: ScoutService) {
	const router = Router();
	const scoutController = new ScoutController({ scoutService });

	router.get("/",
		validate(GetScoutsSchema),
		scoutController.getItems
	);
	router.get(
		"/allScouts",
		scoutController.getAllItems
	);
	router.get(
		"/allEducadores",
		scoutController.getAllItems
	);
	router.get(
		"/:id",
		validate(GetScoutSchema),
		cacheMiddleware,
		scoutController.getItem,
	);
	router.post("/", validate(PostScoutSchema), scoutController.insertItem);
	router.put(
		"/:id",
		validate(PutScoutSchema),
		cleanCacheMiddleware,
		scoutController.updateItem,
	);
	router.delete(
		"/:id",
		validate(DeleteScoutSchema),
		cleanCacheMiddleware,
		scoutController.deleteItem,
	);

	return router;
};
