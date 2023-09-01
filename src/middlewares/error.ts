import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { errorHandler } from "../utils/errorHandler";

const errorMiddleware = (
	error: AppError,
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	if (error) {
		console.log(error);
		errorHandler.handleError(error, res);
	} else {
		next();
	}
};

export { errorMiddleware };
