import { Router } from "express";
import { cacheMiddleware, checkSession, cleanCacheMiddleware } from "../middlewares";
import { EntregaController } from "../controllers/entrega";
import { EntregaService } from "../services/entrega";
import { validate } from "../middlewares/validate";
import {
    DeleteEntregaSchema,
    GetEntregaSchema,
    GetEntregasSchema,
    PostEntregaSchema,
    PutEntregaSchema,
} from "../validators/entrega";

export default function createEntregaRouter(entregaService: EntregaService) {
    const router = Router();
    const entregaController = new EntregaController({ entregaService });

    router.get("/",
        checkSession,
        validate(GetEntregasSchema),
        entregaController.getItems
    );
    router.get(
        "/:id",
        checkSession,
        validate(GetEntregaSchema),
        cacheMiddleware,
        entregaController.getItem,
    );
    router.post("/",
        checkSession,
        validate(PostEntregaSchema),
        entregaController.insertItem
    );
    router.put(
        "/:id",
        checkSession,
        validate(PutEntregaSchema),
        cleanCacheMiddleware,
        entregaController.updateItem,
    );
    router.delete(
        "/:id",
        checkSession,
        validate(DeleteEntregaSchema),
        cleanCacheMiddleware,
        entregaController.deleteItem,
    );

    return router;
};
