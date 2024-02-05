import express, { Router } from "express";
import bodyParser from "body-parser";
import compression from "compression";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import { config } from "dotenv";
import cors from "cors";
config();
import { errorMiddleware, morganMiddleware } from "./middlewares";
import { tooBusy } from "./middlewares/tooBusy";
import { shouldCompress } from "./utils";
import createScoutRouter from "./routes/scout";
import { ScoutService } from "./services/scout";
import { DocumentoService } from "./services/documento";
import createDocumentoRouter from "./routes/documento";
import { PagoService } from "./services/pago";
import createPagoRouter from "./routes/pago";
import { FamiliarService } from "./services/familiar";
import createFamiliarRouter from "./routes/familiar";
import { PatrullaService } from "./services/patrulla";
import createPatrullaRouter from "./routes/patrulla";
import { AuthService } from "./services/auth";
import createAuthRouter from "./routes/auth";
import { EntregaService } from "./services/entrega";
import createEntregaRouter from "./routes/entrega";
import { WhatsAppSbot } from "./whatsapp/WhatsappSession";
import recordarCumpleaños from "./whatsapp/recordarCumpleaños";
import expressOasGenerator, { SPEC_OUTPUT_FILE_BEHAVIOR } from 'express-oas-generator';
import swaggerSpecJSON from "./docs/spec.json";
// import { swaggerDefinition } from "./docs/swagger-ts/swagger";

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
		expressOasGenerator.handleResponses(this.app, {
			specOutputFileBehavior: SPEC_OUTPUT_FILE_BEHAVIOR.PRESERVE,
			swaggerDocumentOptions: {
				customSiteTitle: "Scout API",
				// swaggerOptions: []
				swaggerUrl: "http://localhost:8080/api"
			},
			specOutputPath: './src/docs/spec.json',
			alwaysServeDocs: true,
			// predefinedSpec: function(spec) {
			// 	_.set(spec, 'paths["/students/{name}"].get.parameters[0].description', 'description of a parameter');
			// 	return spec;
			//   },
		});

		this.app.disable("x-powered-by");

		this.app.use(
			bodyParser.urlencoded({
				extended: true,
			}),
		);

		//TODO: Terminar de configurar cors
		// this.app.use(
		// 	cors({
		// 		origin: (origin, callback) => {
		// 			if (!origin) callback(null, true);
		// 			else if (ACCEPTED_ORIGINS.includes(origin)) callback(null, true);
		// 			else callback(new Error("Not allowed by CORS"));
		// 		},
		// 	}),
		// );
		this.app.use(cors())

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
		// this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDefinition));
		this.app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecJSON));
		this.app.use("/api", this.loadRoutes());

		this.app.use(errorMiddleware);

		expressOasGenerator.handleRequests();
	}

	loadRoutes() {
		const router = Router();

		const authService = new AuthService();
		router.use("/auth", createAuthRouter(authService));

		const patrullaService = new PatrullaService();
		router.use("/patrulla", createPatrullaRouter(patrullaService));

		const scoutService = new ScoutService();
		router.use("/scout", createScoutRouter(scoutService));

		const documentoService = new DocumentoService();
		router.use("/documento", createDocumentoRouter(documentoService));

		const pagoService = new PagoService();
		router.use("/pago", createPagoRouter(pagoService));

		const familiarService = new FamiliarService();
		router.use("/familiar", createFamiliarRouter(familiarService));

		const entregaService = new EntregaService();
		router.use("/entrega", createEntregaRouter(entregaService));

		return router;
	}

	async connectWhatsapp() {
		WhatsAppSbot.getInstance()
	}

	loadCrons() {
		recordarCumpleaños()
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
