import { Router } from "express";
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
	router.get("/:id", validate(GetTipoEventoSchema), tipoEventoController.getItem);
	router.post("/", validate(PostTipoEventoSchema), tipoEventoController.insertItem);
	router.put("/:id", validate(PutTipoEventoSchema), tipoEventoController.updateItem);
	router.delete("/:id", validate(DeleteTipoEventoSchema), tipoEventoController.deleteItem);

	return router;
}
