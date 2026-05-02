import { Router } from "express";
import { checkSession } from "../middlewares";
import { BecaSAACController } from "../controllers/becaSAAC";

export default function createBecaSAACRouter() {
	const router = Router();
	const controller = new BecaSAACController();

	router.get("/ciclos/:cicloId", checkSession, controller.listar);
	router.post("/ciclos/:cicloId", checkSession, controller.crear);
	router.patch("/:id", checkSession, controller.actualizar);
	router.delete("/:id", checkSession, controller.eliminar);

	return router;
}
