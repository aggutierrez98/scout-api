import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

const level = () => {
	const env = process.env.NODE_ENV || "development";
	const isDevelopment = env === "development";
	return isDevelopment ? "debug" : "http";
};

export const LOG_LEVELS = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	debug: 4,
};


const format = winston.format.combine(
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
	winston.format.json(),
	winston.format.colorize({
		colors: {
			error: "red",
			warn: "yellow",
			info: "green",
			http: "magenta",
			debug: "white",
		}
	}),
	winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
);

const defineTransports = () => {
	const env = process.env.NODE_ENV || "development";
	const isDevelopment = env === "development";
	return isDevelopment
		? [new winston.transports.Console()]
		: [new winston.transports.Console(), new LogtailTransport(new Logtail(process.env.LOGTAIL_TOKEN ?? "", { endpoint: `https://${process.env.LOGTAIL_INGESTING_HOST}`, }))];
};

const winstonLogger = winston.createLogger({
	levels: LOG_LEVELS, // Define los niveles de log que utilizara la instancia de winston
	level: level(), // Define el nivel mas bajo que se logea en la instancia de winston
	format, // Define el formato del log
	transports: defineTransports(),
});

export default winstonLogger;
