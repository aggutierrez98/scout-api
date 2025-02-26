import { Response } from "express";
import { AppError, HttpCode } from "./AppError";
import logger from "./Logger";

class ErrorHandler {
	private isTrustedError(error: AppError): boolean {
		if (error instanceof AppError) {
			return error.isOperational;
		}
		return false;
	}

	public handleError(error: AppError, response?: Response): void {
		if (this.isTrustedError(error) && response) {
			this.handleTrustedError(error as AppError, response);
		} else {
			this.handleCriticalError(error, response);
		}
	}

	private handleTrustedError(error: AppError, response: Response) {
		logger.debug(error.message);
		return response
			.status(error.httpCode)
			.json({ name: error.name, message: error.message });
	}

	private handleCriticalError(
		error: Error | AppError,
		response?: Response,
	): void {
		logger.error("Error interno del servidor");
		logger.error(`${error.name}: ${error.message}`);

		if (response) {
			response
				.status(HttpCode.INTERNAL_SERVER_ERROR)
				.json({ message: "Error Interno del Servidor" });
		}

		process.exit(1);
	}
}
export const errorHandler = new ErrorHandler();
