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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const whatsapp_js_1 = __importDefault(require("./whatsapp.js"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const ACCEPTED_ORIGINS = ["http://localhost:3000"];
class Server {
    constructor() {
        this.app = (0, express_1.default)();
        // Si no esta especificado el puerto en .env entonces tomara el mismo del archivo de configuración
        this.port = process.env.PORT;
        this.middlewares(); // Define todos los middlewares
    }
    middlewares() {
        this.app.disable("x-powered-by");
        this.app.use(body_parser_1.default.urlencoded({
            extended: true,
        }));
        this.app.use((0, cors_1.default)({
            origin: (origin, callback) => {
                if (!origin)
                    callback(null, true);
                else if (ACCEPTED_ORIGINS.includes(origin))
                    callback(null, true);
                else
                    callback(new Error("Not allowed by CORS"));
            },
        }));
        // const logFormat = process.env.ENVIRONMENT === 'development' ? "dev" : ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
        // this.app.use(morgan(logFormat, {
        //     skip: () => process.env.NODE_ENV === 'test'
        // }))
        // this.app.use(authMiddlewares.checkToken); // Checkeara token en todos los request menos en los especificados en config.json
        // this.app.use(permissionMiddlewares.checkPermission); // Checkeara permisos en todos los request menos en los especificados en config.json
        // this.app.use(headerMiddleware); // Usara el middleware de headers
        this.app.use(body_parser_1.default.json());
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
    connectDB() {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    connectWhatsapp() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, whatsapp_js_1.default)();
        });
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
exports.default = Server;
