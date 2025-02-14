import { Router } from "express";
import { cacheMiddleware, checkSession, cleanCacheMiddleware } from "../middlewares";
import { PagoController } from "../controllers/pago";
import { PagoService } from "../services/pago";
import { validate } from "../middlewares/validate";
import {
	DeletePagoSchema,
	GetPagoSchema,
	GetPagosSchema,
	PostPagoSchema,
	PutPagoSchema,
} from "../validators/pago";

export default function createPagoRouter(pagoService: PagoService) {
	const router = Router();
	const pagoController = new PagoController({ pagoService });

	router.get("/",
		validate(GetPagosSchema),
		pagoController.getItems
	);
	router.get(
		"/:id",
		validate(GetPagoSchema),
		cacheMiddleware,
		pagoController.getItem,
	);
	router.post("/",
		validate(PostPagoSchema),
		pagoController.insertItem
	);
	router.put(
		"/:id",
		validate(PutPagoSchema),
		cleanCacheMiddleware,
		pagoController.updateItem,
	);
	router.delete(
		"/:id",
		validate(DeletePagoSchema),
		cleanCacheMiddleware,
		pagoController.deleteItem,
	);

	return router;
};
