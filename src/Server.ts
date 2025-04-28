import express, { Router } from "express";
import bodyParser from "body-parser";
import compression from "compression";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { config } from "dotenv";
import cors from "cors";
config();
import { checkSession, errorMiddleware, morganMiddleware } from "./middlewares";
import { tooBusy } from "./middlewares/tooBusy";
import { ACCEPTED_ORIGINS, PROXIES_NUMBER, shouldCompress } from "./utils";
import createScoutRouter from "./routes/scout";
import { ScoutService } from "./services/scout";
import { DocumentoService } from "./services/documento";
import createDocumentoRouter from "./routes/documento";
import { PagoService } from "./services/pago";
import createPagoRouter from "./routes/pago";
import { FamiliarService } from "./services/familiar";
import createFamiliarRouter from "./routes/familiar";
import { EquipoService } from "./services/equipo";
import createEquipoRouter from "./routes/equipo";
import { AuthService } from "./services/auth";
import createAuthRouter from "./routes/auth";
import { EntregaService } from "./services/entrega";
import createEntregaRouter from "./routes/entrega";
import recordarCumpleaños from "./whatsapp/recordarCumpleaños";
import swaggerSpecJSON from "./docs/spec.json";
// import { WhatsAppSbot } from "./whatsapp/WhatsappSession";
import logger from "./utils/classes/Logger";
import fileUpload from 'express-fileupload';

// // import expressSession from 'express-session';

export default class Server {
	public app;
	public port;
	public limiter;

	constructor() {
		this.app = express();

		// Limit each IP requests to "max" per "windowMs" time
		this.limiter = rateLimit({
			windowMs: (15) * 60 * 1000, // 15 minutes
			max: 100,
			standardHeaders: "draft-7",
			legacyHeaders: false,
		});

		this.app.disable("x-powered-by");
		// For using express rate limit with proxies (to forward ips to limit requests)
		this.app.set("trust proxy", PROXIES_NUMBER);

		this.port = process.env.PORT;
		this.middlewares();
	}

	middlewares() {
		this.app.use(
			bodyParser.urlencoded({
				extended: true,
			}),
		);

		// this.app.use(
		// 	cors({
		// 		origin: (origin, callback) => {
		// 			if (!origin) callback(null, true);
		// 			else if (ACCEPTED_ORIGINS.length === 0 || ACCEPTED_ORIGINS.includes(origin)) callback(null, true);
		// 			else callback(new Error("Not allowed by CORS"));
		// 		},
		// 	}),
		// );
		this.app.use(cors())

		this.app.use(express.json());
		this.app.use(bodyParser.json({ limit: "50kb" }));
		this.app.use(fileUpload())
		this.app.use(express.static("public"));
		// // this.app.use(expressSession({
		// // 	secret: process.env.COOKIE_SECRET!,
		// // 	resave: false,
		// // 	saveUninitialized: true,
		// // 	cookie: {
		// // 		secure: true,
		// // 		httpOnly: true,
		// // 		maxAge: 1000 * 60 * 60 * 24, // 1 day
		// // 	}
		// // }));
		this.app.use(helmet());
		this.app.use(compression({ filter: shouldCompress }));
		if (process.env.NODE_ENV === "production") {
			this.app.use(this.limiter);
			this.app.use(tooBusy);
		}
		this.app.use(morganMiddleware);
		this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecJSON));
		this.app.use("/api", this.loadRoutes());
		this.app.use(errorMiddleware);
	}

	loadRoutes() {
		const router = Router();

		const authService = new AuthService();
		router.use("/auth", createAuthRouter(authService));

		const equipoService = new EquipoService();
		router.use("/equipo", checkSession, createEquipoRouter(equipoService));

		const scoutService = new ScoutService();
		router.use("/scout", checkSession, createScoutRouter(scoutService));

		const documentoService = new DocumentoService();
		router.use("/documento", checkSession, createDocumentoRouter(documentoService));

		const pagoService = new PagoService();
		router.use("/pago", checkSession, createPagoRouter(pagoService));

		const familiarService = new FamiliarService();
		router.use("/familiar", checkSession, createFamiliarRouter(familiarService));

		const entregaService = new EntregaService();
		router.use("/entrega", checkSession, createEntregaRouter(entregaService));

		// TODO: Crear modelo de eventos

		return router;
	}

	async connectWhatsapp() {
		// WhatsAppSbot.getInstance()
	}

	loadCrons() {
		recordarCumpleaños()
	}

	listen() {
		// Iniciamos el servidor de express en el puerto especificado
		const server = this.app.listen(this.port, () => {
			logger.info(`⚡️[server]: Server running on port ${this.port}`)
			logger.info("-------------------------------------------------- ");
		});
		return server;
	}
}
