import { Router } from "express";
import { cacheMiddleware, cleanCacheMiddleware } from "../middlewares";
import { DocumentoController } from "../controllers/documento";
import { validate } from "../middlewares/validate";
import {
	DeleteDocumentoSchema,
	GetDocumentoSchema,
	GetDocumentosSchema,
	PostDocumentoSchema,
} from "../validators/documento";
import { DocumentoService } from "../services/documento";

export const createDocumentoRouter = (documentoService: DocumentoService) => {
	const router = Router();
	const documentoController = new DocumentoController({ documentoService });

	router.get("/", validate(GetDocumentosSchema), documentoController.getItems);
	router.get(
		"/:id",
		validate(GetDocumentoSchema),
		cacheMiddleware,
		documentoController.getItem,
	);
	router.post(
		"/",
		validate(PostDocumentoSchema),
		documentoController.insertItem,
	);
	router.delete(
		"/:id",
		validate(DeleteDocumentoSchema),
		cleanCacheMiddleware,
		documentoController.deleteItem,
	);

	return router;
};
