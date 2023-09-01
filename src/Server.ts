import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import whatsappClientConnection from "./whatsapp";
import { errorMiddleware } from "./middlewares";
import { router } from "./routes";
import { config } from "dotenv";
config();

const ACCEPTED_ORIGINS = ["http://localhost:3000"];

export default class Server {
	public app;
	public port;

	constructor() {
		this.app = express();
		this.port = process.env.PORT;
		this.middlewares();
	}

	middlewares() {
		this.app.disable("x-powered-by");

		this.app.use(
			bodyParser.urlencoded({
				extended: true,
			}),
		);

		this.app.use(
			cors({
				origin: (origin, callback) => {
					if (!origin) callback(null, true);
					else if (ACCEPTED_ORIGINS.includes(origin)) callback(null, true);
					else callback(new Error("Not allowed by CORS"));
				},
			}),
		);

		// const logFormat = process.env.ENVIRONMENT === 'development' ? "dev" : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
		// this.app.use(morgan(logFormat, {
		//     skip: () => process.env.NODE_ENV === 'test'
		// }))

		this.app.use(bodyParser.json());
		this.app.use(router);
		this.app.use(errorMiddleware);
	}

	// // async connectDB() {}

	async connectWhatsapp() {
		await whatsappClientConnection();
	}

	listen() {
		// Iniciamos el servidor de express en el puerto especificado
		const server = this.app.listen(this.port, () => {
			console.log(`⚡️[server]: Server running on port ${this.port}`);
			console.log("-------------------------------------------------- ");
		});

		return server;
	}
}
