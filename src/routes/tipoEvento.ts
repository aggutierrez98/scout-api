import { Router } from "express";
import { cacheMiddleware, cleanCacheMiddleware } from "../middlewares";
import { TipoEventoController } from "../controllers/tipoEvento";
import { TipoEventoService } from "../services/tipoEvento";
import { validate } from "../middlewares/validate";
import {
	GetTiposEventoSchema,
	GetTipoEventoSchema,
	PostTipoEventoSchema,
	PutTipoEventoSchema,
	DeleteTipoEventoSchema,
} from "../validators/tipoEvento";

export default function createTipoEventoRouter(tipoEventoService: TipoEventoService) {
	const router = Router();
	const tipoEventoController = new TipoEventoController({ tipoEventoService });

	router.get("/", validate(GetTiposEventoSchema), tipoEventoController.getItems);
	router.get("/:id", validate(GetTipoEventoSchema), cacheMiddleware, tipoEventoController.getItem);
	router.post("/", validate(PostTipoEventoSchema), cleanCacheMiddleware, tipoEventoController.insertItem);
	router.put("/:id", validate(PutTipoEventoSchema), cleanCacheMiddleware, tipoEventoController.updateItem);
	router.delete("/:id", validate(DeleteTipoEventoSchema), cleanCacheMiddleware, tipoEventoController.deleteItem);

	return router;
}
