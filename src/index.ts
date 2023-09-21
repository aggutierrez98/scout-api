import Server from "./Server";

//TODO: PROBAR DOCUMENTADO AUTOMATICO EN SWAGGER CON TSOA
//TODO: APLICAR VARIABLES DE ENTORNO USANDO SWAGGER

//TODO: APLICAR PROXY:
// https://www.youtube.com/watch?v=Ppos09yFpzA&t=5s

//TODO: APLICAR PM2 Y DESPLEGAR EN INSTANCIA VM GOOGLE:
// https://console.cloud.google.com/compute/instances?onCreate=true&hl=es&project=scout-api-398021
// https://www.youtube.com/watch?v=T1QFGwOnQxQ

//TODO: APLICAR CLEAN ARCHITECTURE COMBINADA CON SCREAMING ACHITECTURE
// https://www.youtube.com/watch?v=bdnpXzgj1oY
// https://www.npmjs.com/package/eslint-plugin-hexagonal-architecture
// https://www.youtube.com/watch?v=nfaq_UKunsE
// https://www.youtube.com/watch?v=497L4-LhvdM

// import http from 'http';
// import express from 'express';
// import { createHttpTerminator } from 'http-terminator';
// const app = express();
// export const server = http.createServer(app);
// export const httpTerminator = createHttpTerminator({
//   server,
// });

(async () => {
	// rome-ignore lint/suspicious/noExplicitAny: <explanation>
	let server: any = null;
	// process.on("SIGTERM", (signal) => {
	// 	gracefulShutdownMainProcess(signal, server);
	// });
	// process.on("SIGINT", (signal) => {
	// 	gracefulShutdownMainProcess(signal, server);

	// process.on('SIGINT', function() {
	// 	server.close();
	// 	// calling .shutdown allows your process to exit normally
	// 	toobusy.shutdown();
	// 	process.exit();
	//   });
	// });

	const serverInstance = new Server();
	// await serverInstance.connectWhatsapp();
	server = serverInstance.listen();
})();
