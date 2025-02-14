import { NextFunction, Request, Response } from "express";
import { CacheManager } from "../utils/classes/CacheManager";
import { AppError, HttpCode } from "../utils/classes/AppError";

const cacheManager = new CacheManager();

const cleanCacheMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const cacheKey = `${req.originalUrl.split("api/")[1]}`;
	try {
		const oldJSON = res.json;
		res.json = (body) => {
			cacheManager.clearData(cacheKey);
			return oldJSON.call(res, body);
		};
		next();
	} catch (error) {
		next(
			new AppError({
				httpCode: HttpCode.INTERNAL_SERVER_ERROR,
				name: "REDIS_SERVER_ERROR",
				isOperational: false,
				description: error as string,
			}),
		);
	}
};

const cacheMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const cacheKey = `${req.originalUrl.split("api/")[1]}`;

	try {
		const cachedData = await cacheManager.get(cacheKey);
		if (cachedData) {
			res.json(cachedData);
		} else {
			const oldJSON = res.json;
			res.json = (body) => {
				cacheManager.set(cacheKey, body, {
					expirationInMs: 60000,
				});
				return oldJSON.call(res, body);
			};
			next();
		}
	} catch (error) {
		next(
			new AppError({
				httpCode: HttpCode.INTERNAL_SERVER_ERROR,
				name: "REDIS_SERVER_ERROR",
				isOperational: false,
				description: error as string,
			}),
		);
	}
};

export { cleanCacheMiddleware, cacheMiddleware };
