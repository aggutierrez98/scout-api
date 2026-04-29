import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import { SecretsManager } from "../classes/SecretsManager";

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

const winstonLogger = winston.createLogger({
	levels: LOG_LEVELS,
	level: level(),
	format,
	transports: [new winston.transports.Console()],
});

export const setupProductionTransports = () => {
	const env = process.env.NODE_ENV || "development";
	if (env === "development") return;

	const betterstack = SecretsManager.getInstance().getBetterStackSecrets();
	winstonLogger.add(
		new LogtailTransport(
			new Logtail(betterstack.AUTH_TOKEN, {
				endpoint: `https://${betterstack.INGESTING_HOST}`,
			})
		)
	);
};

export default winstonLogger;
