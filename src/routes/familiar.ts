import { Router } from "express";

import { cacheMiddleware, checkSession, cleanCacheMiddleware } from "../middlewares";
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

	router.post("/",
		checkSession,
		validate(PostFamiliarSchema),
		familiarController.insertItem
	);

	router.put(
		"/relate/:id",
		checkSession,
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
