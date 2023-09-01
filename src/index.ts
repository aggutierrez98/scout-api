import Server from "./Server";

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
	// });

	const serverInstance = new Server();
	// await serverInstance.connectWhatsapp();
	server = serverInstance.listen();
})();
