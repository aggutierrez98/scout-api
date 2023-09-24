import { Router } from "express";

import { cacheMiddleware, cleanCacheMiddleware } from "../middlewares";
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
} from "../validators/familiar";

export const createFamiliarRouter = (familiarService: FamiliarService) => {
	const router = Router();
	const familiarController = new FamiliarController({ familiarService });

	router.get(
		"/:id",
		validate(GetFamiliarSchema),
		cacheMiddleware,
		familiarController.getItem,
	);

	router.post("/", validate(PostFamiliarSchema), familiarController.insertItem);

	router.put(
		"/relate/:id",
		validate(RelateFamiliarParams),
		familiarController.relateItem,
	);

	router.put(
		"/unrelate/:id",
		validate(UnrelateFamiliarSchema),
		familiarController.unrelateItem,
	);

	router.put(
		"/:id",
		validate(PutFamiliarSchema),
		cleanCacheMiddleware,
		familiarController.updateItem,
	);

	router.delete(
		"/:id",
		validate(DeleteFamiliarSchema),
		cleanCacheMiddleware,
		familiarController.deleteItem,
	);

	return router;
};
