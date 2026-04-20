import { Router } from "express";
import { NotificacionController } from "../controllers/notificacion";
import { NotificacionService } from "../services/notificacion";
import { validate } from "../middlewares/validate";
import {
	GetAvisoDestinatariosSchema,
	GetAvisosSchema,
	GetNotificacionesSchema,
	PostAvisoSchema,
	PutNotificacionSchema,
} from "../validators/notificacion";
import { DeletePushTokenSchema, PostPushTokenSchema } from "../validators/pushToken";

export default function createNotificacionRouter(notificacionService: NotificacionService) {
	const router = Router();
	const notificacionController = new NotificacionController({ notificacionService });

	// Admin: lista de avisos enviados (debe ir ANTES de /:id)
	router.get("/avisos",
		validate(GetAvisosSchema),
		notificacionController.getAvisos,
	);
	router.get("/avisos/:id/destinatarios",
		validate(GetAvisoDestinatariosSchema),
		notificacionController.getAvisoDestinatarios,
	);

	router.get("/",
		validate(GetNotificacionesSchema),
		notificacionController.getItems,
	);
	router.get("/:id",
		validate(PutNotificacionSchema),
		notificacionController.getItem,
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

	// Push tokens: detalle de implementación del sistema de notificaciones
	router.post("/push-token",
		validate(PostPushTokenSchema),
		notificacionController.registerPushToken,
	);
	router.delete("/push-token",
		validate(DeletePushTokenSchema),
		notificacionController.unregisterPushToken,
	);

	return router;
}
