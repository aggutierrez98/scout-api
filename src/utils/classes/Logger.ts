import winstonLogger, { LOG_LEVELS } from "../lib/winston.util";
type logLevels = keyof typeof LOG_LEVELS;

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
	debug = (message: string) => {
		winstonLogger.debug(message);
	};
}

const logger = new Logger();

export default logger;
