import express, { Request, Response, Router } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import whatsappClientConnection from "./whatsapp";
import { errorMiddleware, morganMiddleware } from "./middlewares";
import swaggerUi from "swagger-ui-express";
import { config } from "dotenv";
config();
import { swaggerDefinition } from "./docs/swagger-ts/swagger";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { tooBusy } from "./middlewares/tooBusy";
import compression from "compression";
import { shouldCompress } from "./utils";
import { createScoutRouter } from "./routes/scout";
import { ScoutService } from "./services/scout";
import winston from "winston";
import { PatrullaService } from "./services/patrulla";
import { createPatrullaRouter } from "./routes/patrulla";
import { DocumentoService } from "./services/documento";
import { createDocumentoRouter } from "./routes/documento";
import { PagoService } from "./services/pago";
import { createPagoRouter } from "./routes/pago";

const PATH_ROUTER = `${__dirname}`;

// import swaggerSetup from "./docs/ymlToJson";
// import swaggerSetup from "./docs/exampleToJson";

const ACCEPTED_ORIGINS = ["http://localhost:3000"];
const numberOfProxiesOnServer = 1;

export default class Server {
	public app;
	public port;

	constructor() {
		this.app = express();

		// For using express rate limit with proxies
		this.app.set("trust proxy", numberOfProxiesOnServer);

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

		this.app.use(express.json());
		this.app.use(bodyParser.json({ limit: "50kb" }));
		this.app.use(bodyParser.urlencoded({ extended: true }));
		this.app.use(express.static("public"));
		this.app.use(helmet());
		this.app.use(compression({ filter: shouldCompress }));

		const limiter = rateLimit({
			windowMs: 15 * 60 * 1000, // 15 minutes
			max: 100, // Limit each IP to 100 requests per "windowMs" time
			standardHeaders: "draft-7",
			legacyHeaders: false,
		});

		this.app.use(limiter);
		this.app.use(tooBusy);
		this.app.use(morganMiddleware);
		this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDefinition));

		// // this.app.use("/api", routes);
		this.app.use("/api", this.loadRoutes());

		this.app.use(errorMiddleware);
	}

	loadRoutes() {
		const router = Router();

		const scoutService = new ScoutService();
		router.use("/scout", createScoutRouter(scoutService));

		// const patrullaService = new PatrullaService();
		// router.use("/patrulla", createPatrullaRouter(patrullaService));

		const documentoService = new DocumentoService();
		router.use("/documento", createDocumentoRouter(documentoService));
		const pagoService = new PagoService();
		router.use("/pago", createPagoRouter(pagoService));

		return router;

		// TODO: Reveer metodo de lectura dinamica de routers haciendo dependency injection
		// // const PATH_ROUTER = `${__dirname}`;
		// // readdirSync(PATH_ROUTER).filter((fileName) => {
		// // 	const cleanName = cleanFileName(fileName);
		// // 	if (cleanName !== "index") {
		// // 		import(`./${cleanName}`).then(({ createRouter }) => {
		// // 			router.use(`/${cleanName}`, createRouter());
		// // 		});
		// // 	}
		// // });
	}

	createLogger() {}

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
