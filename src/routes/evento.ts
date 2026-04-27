import { Router } from "express";
import { cacheMiddleware, cleanCacheMiddleware } from "../middlewares";
import { EventoController } from "../controllers/evento";
import { EventoService } from "../services/evento";
import { validate } from "../middlewares/validate";
import {
	GetEventosSchema,
	GetEventoSchema,
	GetEventoNominaSchema,
	PostEventoSchema,
	PutEventoSchema,
	DeleteEventoSchema,
	PostParticipantesSchema,
	DeleteParticipanteSchema,
	DeleteParticipantesSchema,
} from "../validators/evento";

export default function createEventoRouter(eventoService: EventoService) {
	const router = Router();
	const eventoController = new EventoController({ eventoService });

	router.get("/", validate(GetEventosSchema), eventoController.getItems);
	router.get("/mis-eventos", eventoController.getMisEventos);
	router.get("/:id", validate(GetEventoSchema), cacheMiddleware, eventoController.getItem);
	router.get("/:id/nomina", validate(GetEventoNominaSchema), eventoController.exportNomina);
	router.post("/", validate(PostEventoSchema), cleanCacheMiddleware, eventoController.insertItem);
	router.put("/:id", validate(PutEventoSchema), cleanCacheMiddleware, eventoController.updateItem);
	router.delete("/:id", validate(DeleteEventoSchema), cleanCacheMiddleware, eventoController.deleteItem);
	router.post("/:id/participantes", validate(PostParticipantesSchema), cleanCacheMiddleware, eventoController.addParticipantes);
	router.delete("/:id/participantes", validate(DeleteParticipantesSchema), cleanCacheMiddleware, eventoController.removeAllParticipantes);
	router.delete("/:id/participantes/:participanteId", validate(DeleteParticipanteSchema), cleanCacheMiddleware, eventoController.removeParticipante);

	return router;
}
