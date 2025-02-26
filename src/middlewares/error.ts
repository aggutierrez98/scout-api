import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/classes/AppError";
import { errorHandler } from "../utils/classes/ErrorHandler";

const errorMiddleware = (
	error: AppError,
	_: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (error) {
		errorHandler.handleError(error, res);
	} else {
		next();
	}
};

export { errorMiddleware };
