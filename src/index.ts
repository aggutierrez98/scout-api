import { IncomingMessage, Server, ServerResponse } from "http";
import { CacheManager, gracefulShutdownMainProcess } from "./utils";
import { SecretsManager } from "./utils/classes/SecretsManager";

(async () => {
	let server: Server<typeof IncomingMessage, typeof ServerResponse>;
	process.on("SIGTERM", signal => { gracefulShutdownMainProcess(signal, server) })
	process.on("SIGINT", signal => { gracefulShutdownMainProcess(signal, server) })

	// Inicializar SecretsManager y CacheManager antes de todo
	await SecretsManager.getInstance().initialize();
	await CacheManager.getInstance().initialize()

	const { default: ServerModel } = await import("./Server");
	const serverInstance = new ServerModel();

	serverInstance.loadCrons();
	server = serverInstance.listen();
})();
