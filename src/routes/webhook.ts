import { Router } from "express";
import { WebhookController } from "../controllers/webhook";
import { WebhookService } from "../services/webhook";
import { validate } from "../middlewares/validate";
import { webhookAuth } from "../middlewares/webhookAuth";
import { PostWebhookComprobanteSchema } from "../validators/webhook";

export default function createWebhookRouter(webhookService: WebhookService) {
	const router = Router();
	const webhookController = new WebhookController({ webhookService });

	router.post(
		"/comprobante",
		webhookAuth,
		validate(PostWebhookComprobanteSchema),
		webhookController.procesarComprobante,
	);

	return router;
};
