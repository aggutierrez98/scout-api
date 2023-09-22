import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";
import { AppError, HttpCode } from "../utils/classes/AppError";
import { errorMap } from "../validators";

export const validate =
	(schema: AnyZodObject) =>
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const parseReturn = await schema.safeParseAsync(
				{
					body: req.body,
					query: req.query,
					params: req.params,
				},
				{ errorMap: errorMap },
			);

			if (!parseReturn.success) {
				let errorMessage = "Parametros incorrectos: \n";

				parseReturn.error.errors.forEach((error, i) => {
					errorMessage = errorMessage.concat(
						`[${i + 1} → ${error.path[1]}]: ${error.message} \n`,
					);
				});

				throw new AppError({
					name: "BAD_PARAMETERS",
					description: errorMessage,
					httpCode: HttpCode.BAD_REQUEST,
				});
			}
			next();
		} catch (e) {
			next(e);
		}
	};
