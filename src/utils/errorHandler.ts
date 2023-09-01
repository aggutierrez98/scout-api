import { Response } from "express";
import { AppError, HttpCode } from "./AppError";

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

	// rome-ignore lint/suspicious/noExplicitAny: <explanation>
	private handleTrustedError(error: AppError, response: Response): any {
		return response.status(error.httpCode).json({ message: error.message });
	}

	private handleCriticalError(
		error: Error | AppError,
		response?: Response,
	): void {
		if (response) {
			response
				.status(HttpCode.INTERNAL_SERVER_ERROR)
				.json({ message: "Internal server error" });
		}

		console.log("Application encountered a critical error. Exiting");
		process.exit(1);
	}
}
export const errorHandler = new ErrorHandler();
