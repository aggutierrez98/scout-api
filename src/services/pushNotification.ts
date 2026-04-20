import { Expo, ExpoPushMessage } from "expo-server-sdk";
import admin from "firebase-admin";
import { IAvisoData } from "../types";
import { PushTokenService } from "./pushToken";
import logger from "../utils/classes/Logger";
import { SecretsManager } from "../utils/classes/SecretsManager";

let firebaseInitialized = false;

const initFirebase = () => {
	if (firebaseInitialized || admin.apps.length > 0) return;
	const secrets = SecretsManager.getInstance();
	if (!secrets.isReady()) {
		logger.warn("[Push] SecretsManager no inicializado — push web deshabilitado");
		return;
	}
	const serviceAccountJson = secrets.getFirebaseSecrets().SERVICE_ACCOUNT_JSON;

	if (!serviceAccountJson) {
		logger.warn("[Push] FIREBASE SERVICE_ACCOUNT_JSON no configurada — push web deshabilitado");
		return;
	}
	const serviceAccount = JSON.parse(serviceAccountJson);
	// Infisical/env vars double-escape newlines in the PEM key — fix before passing to Firebase
	if (serviceAccount.private_key) {
		serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
	}
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
	});
	firebaseInitialized = true;
};

const expo = new Expo();

export class PushNotificationService {
	private pushTokenService: PushTokenService;

	constructor({ pushTokenService }: { pushTokenService: PushTokenService }) {
		this.pushTokenService = pushTokenService;
		initFirebase();
	}

	sendPushToUsers = async (userIds: string[], aviso: IAvisoData) => {
		const tokens = await this.pushTokenService.getTokensDeUsuarios(userIds);
		if (tokens.length === 0) return;

		const expoTokens = tokens.filter((t) => t.platform === "EXPO").map((t) => t.token);
		const webTokens = tokens.filter((t) => t.platform === "WEB").map((t) => t.token);

		await Promise.allSettled([
			expoTokens.length > 0 ? this.sendViaExpo(expoTokens, aviso) : Promise.resolve(),
			webTokens.length > 0 ? this.sendViaFirebase(webTokens, aviso) : Promise.resolve(),
		]);
	};

	private sendViaExpo = async (tokens: string[], aviso: IAvisoData) => {
		const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
		if (validTokens.length === 0) return;

		const messages: ExpoPushMessage[] = validTokens.map((to) => ({
			to,
			title: aviso.titulo,
			body: aviso.mensaje,
			data: {
				notificacionAvisoId: aviso.id,
				tipo: aviso.tipo,
				referenciaId: aviso.referenciaId ?? undefined,
				referenciaTipo: aviso.referenciaTipo ?? undefined,
			},
			sound: "default",
		}));

		const chunks = expo.chunkPushNotifications(messages);
		for (const chunk of chunks) {
			try {
				const receipts = await expo.sendPushNotificationsAsync(chunk);
				for (const receipt of receipts) {
					if (receipt.status === "error") {
						logger.error(`[Push/Expo] Error: ${receipt.message}`);
					}
				}
			} catch (err) {
				logger.error(`[Push/Expo] Chunk send error: ${(err as Error).message}`);
			}
		}
	};

	private sendViaFirebase = async (tokens: string[], aviso: IAvisoData) => {
		if (!firebaseInitialized && admin.apps.length === 0) return;

		const message = {
			notification: {
				title: aviso.titulo,
				body: aviso.mensaje,
			},
			data: {
				notificacionAvisoId: aviso.id,
				tipo: aviso.tipo,
				...(aviso.referenciaId ? { referenciaId: aviso.referenciaId } : {}),
				...(aviso.referenciaTipo ? { referenciaTipo: aviso.referenciaTipo } : {}),
			},
			tokens,
		};

		try {
			const response = await admin.messaging().sendEachForMulticast(message);
			if (response.failureCount > 0) {
				response.responses.forEach((resp, idx) => {
					if (!resp.success) {
						logger.error(`[Push/FCM] Token ${tokens[idx]} error: ${resp.error?.message}`);
					}
				});
			}
		} catch (err) {
			logger.error(`[Push/FCM] Send error: ${(err as Error).message}`);
		}
	};
}
