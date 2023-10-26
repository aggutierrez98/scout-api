import { NextFunction, Request, Response } from "express";
import toobusy from "toobusy-js";
import { AppError, HttpCode } from "../utils/classes/AppError";

export const tooBusy = (_: Request, __: Response, next: NextFunction) => {
	if (toobusy()) {
		throw new AppError({
			name: "SERVER_TOO_BUSY",
			description: "Server too busy right now",
			httpCode: HttpCode.SERVER_TOO_BUSY,
		});
	} else {
		next();
	}
};
