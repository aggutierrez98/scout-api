import { IncomingMessage, Server, ServerResponse } from "http";
import ServerModel from "./Server";
import { gracefulShutdownMainProcess } from "./utils";

// TODO: Agregar scripts para exportar la base de datos segun fechas
// TODO: Agregar script para importar la base de datos segun archivos

(async () => {
	let server: Server<typeof IncomingMessage, typeof ServerResponse>;
	process.on("SIGTERM", signal => { gracefulShutdownMainProcess(signal, server) })
	process.on("SIGINT", signal => { gracefulShutdownMainProcess(signal, server) })

	const serverInstance = new ServerModel();
	await serverInstance.connectWhatsapp();
	serverInstance.loadCrons();
	server = serverInstance.listen();
})();
