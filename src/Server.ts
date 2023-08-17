import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import whatsappClientConnection from "./whatsapp";
import { config } from "dotenv";
config();

// import { PrismaClient } from "@prisma/client";

const ACCEPTED_ORIGINS = ["http://localhost:3000"];

export default class Server {
	public app;
	public port;

	constructor() {
		this.app = express();

		// Si no esta especificado el puerto en .env entonces tomara el mismo del archivo de configuración
		this.port = process.env.PORT;
		this.middlewares(); // Define todos los middlewares
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

		// this.app.use(authMiddlewares.checkToken); // Checkeara token en todos los request menos en los especificados en config.json
		// this.app.use(permissionMiddlewares.checkPermission); // Checkeara permisos en todos los request menos en los especificados en config.json
		// this.app.use(headerMiddleware); // Usara el middleware de headers

		this.app.use(bodyParser.json());

		// this.moduleRoutes() // Asignas las rutas de modulos al app

		// this.app.use((error, req, res, next) => {
		//     if (error) {
		//         console.error(error)
		//         if(!error.code) {
		//             const error = new CustomError(errors.generics.SERVER_ERROR)
		//             return views.error.customCode(res, error)
		//         }

		//         return views.error.customCode(res, error)
		//     } else {
		//         next()
		//     }
		// })

		this.app.get("/", (req, res) => {
			res.send("Hello World!");
		});
	}

	// moduleRoutes() {
	//     // Incluimos los modulos --
	//     try {
	//         require('./modules/setup');
	//     } catch (e) {
	//         console.log(e);
	//     }

	//     // Rutas de módulos
	//     global.modules.forEach(module => {
	//         this.app.use(`${config.mainInfo.routes}/${module.name}`, module.requires.routes);
	//     });
	// }

	async connectDB() {}

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
