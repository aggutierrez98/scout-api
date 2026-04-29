import { Router } from "express";
import { cacheMiddleware, checkSession, cleanCacheMiddleware } from "../middlewares";
import { DocumentoController } from "../controllers/documento";
import { validate } from "../middlewares/validate";
import {
	DeleteDocumentoSchema,
	GetDocumentoSchema,
	GetDocumentosSchema,
	GetDocumentosPendientesSchema,
	PostDocumentoSchema,
	FillDocumentSchema,
	SignDocumentSchema,
	UploadDocumentSchema,
	ConfirmScanDocumentoSchema,
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
		"/pendientes",
		validate(GetDocumentosPendientesSchema),
		documentoController.getDocumentosPendientes,
	);
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
	router.post(
		"/:id/archivo",
		cleanCacheMiddleware,
		documentoController.uploadArchivo,
	);
	router.post(
		"/scan",
		documentoController.scanDocument,
	);
	router.post(
		"/scan/bulk",
		documentoController.scanDocumentBulk,
	);
	router.post(
		"/scan/bulk/confirm",
		cleanCacheMiddleware,
		documentoController.confirmScanDocumentBulk,
	);
	router.post(
		"/scan/confirm",
		validate(ConfirmScanDocumentoSchema),
		cleanCacheMiddleware,
		documentoController.confirmScanDocument,
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
