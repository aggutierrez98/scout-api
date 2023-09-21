import logger from "./Logger";

class ExitHandler {
	public async handleExit(code: number, timeout = 5000): Promise<void> {
		setTimeout(() => {
			logger.info(`Forcing a shutdown with code ${code}`);
			process.exit(code);
		}, timeout).unref();

		// Graceful shutdown logic goes here

		process.exit(code);
	}
}

export const exitHandler = new ExitHandler();
