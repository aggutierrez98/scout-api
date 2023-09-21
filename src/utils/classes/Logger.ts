import winstonLogger from "../lib/winston.util";

// type logLevels = keyof typeof logLevelsEnum;
type logLevels = "error" | "warn" | "info" | "http";

export type logLevelsInterface = {
	[key in logLevels]: (message: string) => void;
};

class Logger implements logLevelsInterface {
	error = (message: string) => {
		winstonLogger.error(message);
	};
	warn = (message: string) => {
		winstonLogger.warn(message);
	};
	info = (message: string) => {
		winstonLogger.info(message);
	};
	http = (message: string) => {
		winstonLogger.http(message);
	};
}

const logger = new Logger();

export default logger;
