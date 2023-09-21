// import { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import logger from "../utils/classes/Logger";

// const logMiddleware = (req: Request, res: Response, next: NextFunction) => {
// 	const header = req.headers;
// 	const userAgent = header["user-agent"];
// 	console.log("user-agent", userAgent);
// 	next();
// };

const stream = {
	write: (message: string) => logger.http(message),
};

const skip = () => {
	const env = process.env.NODE_ENV || "development";
	return env !== "development";
};

const morganMiddleware = morgan(
	":remote-addr :method :url :status :res[content-length] - :response-time ms",
	{ stream, skip },
);

export {
	// logMiddleware,
	morganMiddleware,
};
