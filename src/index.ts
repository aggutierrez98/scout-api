// import mongoose from "mongoose";
import Server from "./Server";

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
// const gracefulShutdownMainProcess = (signal: any, server: any) => {
// 	console.log(
// 		`\nSe recibió una señal ${signal}, se cierran conexiones antes de terminar el proceso`,
// 	);
// 	server.close(() => {
// 		console.log("Servidor HTTP desconectado");
// 		mongoose.connections.forEach((connection) => {
// 			const { name, host, port } = connection;
// 			connection.close();
// 			console.log(`Se cerró la conexion con ${host}:${port}/${name}`);
// 		});
// 		console.log(
// 			"Conexiones con servidor y base de datos cerradas correctamente, se finaliza el proceso",
// 		);
// 		process.exit(0);
// 	});
// };

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
	await serverInstance.connectWhatsapp();
	server = serverInstance.listen();
})();
