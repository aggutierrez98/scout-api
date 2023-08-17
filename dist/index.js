"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Server_js_1 = __importDefault(require("./Server.js"));
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
(() => __awaiter(void 0, void 0, void 0, function* () {
    // rome-ignore lint/suspicious/noExplicitAny: <explanation>
    let server = null;
    // process.on("SIGTERM", (signal) => {
    // 	gracefulShutdownMainProcess(signal, server);
    // });
    // process.on("SIGINT", (signal) => {
    // 	gracefulShutdownMainProcess(signal, server);
    // });
    const serverInstance = new Server_js_1.default();
    yield serverInstance.connectWhatsapp();
    server = serverInstance.listen();
}))();
