import winston from "winston";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";

// This method set the current severity based on the current NODE_ENV
const level = () => {
	const env = process.env.NODE_ENV || "development";
	const isDevelopment = env === "development";
	return isDevelopment ? "debug" : "warn";
};

const LOG_LEVELS = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	debug: 4,
};

// Define different colors for each level.
winston.addColors({
	error: "red",
	warn: "yellow",
	info: "green",
	http: "magenta",
	debug: "white",
});

// Chose the aspect of your log customizing the log format.
const format = winston.format.combine(
	// Add the message timestamp with the preferred format
	winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
	// Tell Winston that the logs must be colored
	winston.format.colorize({ all: true }),
	// Define the format of the message showing the timestamp, the level and the message
	winston.format.printf(
		(info) => `${info.timestamp} ${info.level}: ${info.message}`,
	),
);

// Define which transports the logger must use to print out messages.
const defineTransports = () => {
	const env = process.env.NODE_ENV || "development";
	const isDevelopment = env === "development";
	return isDevelopment
		? [new winston.transports.Console()]
		: [new winston.transports.Console(), new LogtailTransport(new Logtail(process.env.LOGTAIL_TOKEN ?? ""))];
};

// Create the logger instance
const winstonLogger = winston.createLogger({
	// Define your severity levels.
	levels: LOG_LEVELS,
	// Level to use
	level: level(),
	format,
	transports: defineTransports(),
});

export default winstonLogger;
