import { Router } from "express";
import { NominaController } from "../controllers/nomina";
import { NominaService } from "../services/nomina";
import { validate } from "../middlewares/validate";
import { nominaWebhookAuth } from "../middlewares/nominaWebhookAuth";
import { PostNominaWebhookSchema } from "../validators/nomina";

export default function createNominaRouter(nominaService: NominaService) {
	const router = Router();
	const nominaController = new NominaController({ nominaService });

	/**
	 * Forma 2 — Webhook push desde cruz-del-sur.
	 * Ruta completa: POST /api/webhook/nomina
	 * Autenticado por HMAC-SHA256. NO requiere checkSession.
	 *
	 * Headers requeridos:
	 *   X-Webhook-Source: cruz-del-sur
	 *   X-Webhook-Secret: HMAC-SHA256(body, NOMINA_WEBHOOK_SECRET)
	 */
	router.post(
		"/nomina",
		nominaWebhookAuth,
		validate(PostNominaWebhookSchema),
		nominaController.recibirWebhook,
	);

	return router;
}

/**
 * Router para la ruta protegida on-demand (/api/nomina/sync).
 * Se monta con checkSession en Server.ts, igual que el resto de recursos.
 */
export function createNominaSyncRouter(nominaService: NominaService) {
	const router = Router();
	const nominaController = new NominaController({ nominaService });

	/**
	 * Forma 1 — On-demand pull.
	 * El servidor llama a cruz-del-sur, obtiene la nómina y sincroniza.
	 * Requiere sesión con permiso de ADMINISTRADOR.
	 */
	router.post("/sync", nominaController.syncOnDemand);

	return router;
}
