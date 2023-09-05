import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import whatsappClientConnection from "./whatsapp";
import { errorMiddleware } from "./middlewares";
import routes from "./routes";
import swaggerUi from "swagger-ui-express";
import { config } from "dotenv";
config();
import swaggerSetup from "./docs/swagger";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { tooBusy } from "./middlewares/tooBusy";
import compression from "compression";
import shouldCompress from "./utils/shouldCompress";

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

		// const logFormat = process.env.ENVIRONMENT === 'development' ? "dev" : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
		// this.app.use(morgan(logFormat, {
		//     skip: () => process.env.NODE_ENV === 'test'
		// }))

		this.app.use(express.json());
		this.app.use(bodyParser.json({ limit: "50kb" }));
		this.app.use(bodyParser.urlencoded({ extended: true }));
		this.app.use(express.static("public"));
		this.app.use(helmet());
		this.app.use(compression({ filter: shouldCompress }));

		const limiter = rateLimit({
			windowMs: 15 * 60 * 1000, // 15 minutes
			max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
			standardHeaders: "draft-7",
			legacyHeaders: false,
		});

		// Apply the rate limiting middleware to all requests
		this.app.use(limiter);
		this.app.use(tooBusy);

		this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSetup));

		this.app.use("/api", routes);
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
