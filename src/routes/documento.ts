import { Router } from "express";
import { cacheMiddleware, checkSession, cleanCacheMiddleware } from "../middlewares";
import { DocumentoController } from "../controllers/documento";
import { validate } from "../middlewares/validate";
import {
	DeleteDocumentoSchema,
	GetDocumentoSchema,
	GetDocumentosSchema,
	PostDocumentoSchema,
	FillDocumentSchema,
	SignDocumentSchema,
	UploadDocumentSchema,
} from "../validators/documento";
import { DocumentoService } from "../services/documento";

export default function createDocumentoRouter(documentoService: DocumentoService) {
	const router = Router();
	const documentoController = new DocumentoController({ documentoService });

	router.get("/",
		validate(GetDocumentosSchema),
		documentoController.getItems
	);
	router.get("/data",
		documentoController.getData
	);
	router.get(
		"/:id",
		validate(GetDocumentoSchema),
		documentoController.getItem,
		cacheMiddleware,
	);
	router.post(
		"/",
		validate(PostDocumentoSchema),
		documentoController.insertItem,
	);
	router.post(
		"/fill",
		validate(FillDocumentSchema),
		documentoController.fillDocument,
	);
	router.post(
		"/sign",
		validate(SignDocumentSchema),
		documentoController.signDocument,
	);
	router.post(
		"/upload",
		validate(UploadDocumentSchema),
		documentoController.uploadDocument,
	);
	router.delete(
		"/:id",
		validate(DeleteDocumentoSchema),
		cleanCacheMiddleware,
		documentoController.deleteItem,
	);

	return router;
};
