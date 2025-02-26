import morgan from "morgan";
import logger from "../utils/classes/Logger";

const stream = {
	write: (message: string) => logger.http(message),
};


const skip = () => {
	const env = process.env.NODE_ENV || "development";
	return env === "test";
};

// // morgan.token("legajo", (req, _) => {
// // 	const { authUser } = req
// // 	return authUser?.length ? req.authUser[0].legajo : ""
// // })
// // morgan.token("hostname", () => hostname())
const logFormat = process.env.NODE_ENV !== 'production' ? "dev" : ":remote-addr :method :url :status :res[content-length] :user-agent - :response-time ms"

const morganMiddleware = morgan(
	logFormat,
	{ stream, skip },
);

export {
	morganMiddleware,
};
