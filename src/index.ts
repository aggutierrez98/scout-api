import { IncomingMessage, Server, ServerResponse } from "http";
import ServerModel from "./Server";
import { gracefulShutdownMainProcess } from "./utils";

(async () => {
	let server: Server<typeof IncomingMessage, typeof ServerResponse>;
	process.on("SIGTERM", signal => { gracefulShutdownMainProcess(signal, server) })
	process.on("SIGINT", signal => { gracefulShutdownMainProcess(signal, server) })

	const serverInstance = new ServerModel();
	// await serverInstance.connectWhatsapp();
	serverInstance.loadCrons();
	server = serverInstance.listen();
})();
