import { Router } from "express";
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
	router.get("/:id", validate(GetEventoSchema), eventoController.getItem);
	router.get("/:id/nomina", validate(GetEventoNominaSchema), eventoController.exportNomina);
	router.post("/", validate(PostEventoSchema), eventoController.insertItem);
	router.put("/:id", validate(PutEventoSchema), eventoController.updateItem);
	router.delete("/:id", validate(DeleteEventoSchema), eventoController.deleteItem);
	router.post("/:id/participantes", validate(PostParticipantesSchema), eventoController.addParticipantes);
	router.delete("/:id/participantes", validate(DeleteParticipantesSchema), eventoController.removeAllParticipantes);
	router.delete("/:id/participantes/:participanteId", validate(DeleteParticipanteSchema), eventoController.removeParticipante);

	return router;
}
