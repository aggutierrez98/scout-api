import { IncomingMessage, Server, ServerResponse } from "http";
import ServerModel from "./Server";
import { gracefulShutdownMainProcess } from "./utils";

//TODO: APLICAR PM2 Y DESPLEGAR EN INSTANCIA VM GOOGLE:
// https://console.cloud.google.com/compute/instances?onCreate=true&hl=es&project=scout-api-398021
// https://www.youtube.com/watch?v=T1QFGwOnQxQ

//TODO: PROBAR DOCUMENTADO AUTOMATICO EN SWAGGER CON TSOA
//TODO: APLICAR VARIABLES DE ENTORNO USANDO SWAGGER

//TODO: APLICAR CLEAN ARCHITECTURE COMBINADA CON SCREAMING ACHITECTURE
// https://www.youtube.com/watch?v=bdnpXzgj1oY
// https://www.npmjs.com/package/eslint-plugin-hexagonal-architecture
// https://www.youtube.com/watch?v=nfaq_UKunsE
// https://www.youtube.com/watch?v=497L4-LhvdM

(async () => {
	let server: Server<typeof IncomingMessage, typeof ServerResponse>;
	process.on("SIGTERM", signal => { gracefulShutdownMainProcess(signal, server) })
	process.on("SIGINT", signal => { gracefulShutdownMainProcess(signal, server) })

	const serverInstance = new ServerModel();
	// await serverInstance.connectWhatsapp();
	server = serverInstance.listen();
})();
