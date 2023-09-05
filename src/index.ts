import Server from "./Server";

//TODO: TERMINAR DOCUMENTACION CON SWAGGER DIVIDIDA EN ARCHIVOS
// PROBAR https://ts-spec.github.io/tspec/guide/getting-started

//TODO: APLICAR VARIABLES DE ENTORNO USANDO SWAGGER

//TODO: TERMINAR SCHEMA VALIDATION CON ZOD O ALTERNATIVA
// https://dev.to/franciscomendes10866/schema-validation-with-zod-and-expressjs-111p
// https://www.youtube.com/watch?v=VMRgFfmv6j0

//TODO: AGREGAR CACHEADO DE REQUEST CON REDIS:
// https://medium.com/swlh/caching-in-node-js-using-redis-3b5400f41699

//TODO: APLICAR PROXY:
// https://www.youtube.com/watch?v=Ppos09yFpzA&t=5s

//TODO: APLICAR PM2 Y DESPLEGAR EN INSTANCIA VM GOOGLE:
// https://console.cloud.google.com/compute/instances?onCreate=true&hl=es&project=scout-api-398021
// https://www.youtube.com/watch?v=T1QFGwOnQxQ

//TODO: APLICAR LOGGING MIDDLEWARE:
// QUIZAS APLICAR SENTRY:
// https://www.freecodecamp.org/news/how-to-add-sentry-to-your-node-js-project-with-typescript/
// QUIZAS USANDO WINSTON:
// madhur.co.in/blog/2016/12/04/integrating-sentry-node.html

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
