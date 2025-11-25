import { IncomingMessage, Server, ServerResponse } from "http";
import { gracefulShutdownMainProcess } from "./utils";
import { SecretsManager } from "./utils/classes/SecretsManager";

(async () => {
	let server: Server<typeof IncomingMessage, typeof ServerResponse>;
	process.on("SIGTERM", signal => { gracefulShutdownMainProcess(signal, server) })
	process.on("SIGINT", signal => { gracefulShutdownMainProcess(signal, server) })

	// Inicializar SecretsManager antes de todo
	console.log('🔐 Inicializando Secrets Manager...');
	await SecretsManager.getInstance().initialize();
	console.log('✅ Secrets Manager inicializado correctamente');

	const { default: ServerModel } = await import("./Server");
	const serverInstance = new ServerModel();
	// await serverInstance.connectWhatsapp();
	serverInstance.loadCrons();
	server = serverInstance.listen();
})();
