import { Router } from "express";
import { NotificacionController } from "../controllers/notificacion";
import { NotificacionService } from "../services/notificacion";
import { validate } from "../middlewares/validate";
import {
	GetNotificacionesSchema,
	PostAvisoSchema,
	PutNotificacionSchema,
} from "../validators/notificacion";

export default function createNotificacionRouter(notificacionService: NotificacionService) {
	const router = Router();
	const notificacionController = new NotificacionController({ notificacionService });

	router.get("/",
		validate(GetNotificacionesSchema),
		notificacionController.getItems,
	);
	router.post("/",
		validate(PostAvisoSchema),
		notificacionController.insertItem,
	);
	// Marcar TODAS como leídas — debe ir ANTES de /:id para que no matchee "read-all" como id
	router.put("/read-all",
		notificacionController.updateAllRead,
	);
	router.put("/:id",
		validate(PutNotificacionSchema),
		notificacionController.updateItem,
	);

	return router;
}
