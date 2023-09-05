import { Request, Response, NextFunction } from "express";
import {
	deleteScout,
	getScout,
	getScouts,
	insertScout,
	updateScout,
} from "../services/scout";
import { AppError, HttpCode } from "../utils/AppError";
import { OrderToGetScouts } from "../interfaces/types";
import { Delete, Get, Put, Route, Post } from "tsoa";

const getItem = async (
	{ params }: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = params;
		const response = await getScout(id);

		if (!response) {
			throw new AppError({
				name: "NOT_FOUND",
				description: "Scout not found",
				httpCode: HttpCode.NOT_FOUND,
			});
		}

		res.send(response);
	} catch (e) {
		next(e);
	}
};

const getItems = async (req: Request, res: Response, next: NextFunction) => {
	try {
		//VALIDAR LIMIT OFFSET Y ORDER
		const { offset, limit, orderBy } = req.query;

		const response = await getScouts({
			limit: limit ? Number(limit) : undefined,
			offset: offset ? Number(offset) : undefined,
			orderBy: orderBy as OrderToGetScouts,
		});
		res.send(response);
	} catch (e) {
		console.log(e);
		next(e);
	}
};

const updateItem = async (
	{ params, body }: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = params;
		const response = await updateScout(id, body);

		if (!response) {
			throw new AppError({
				name: "NOT_FOUND",
				description: "Scout not found",
				httpCode: HttpCode.NOT_FOUND,
			});
		}

		res.send(response);
	} catch (e) {
		next(e);
	}
};

const insertItem = async (
	{ body }: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const responseScout = await insertScout(body);
		res.send(responseScout);
	} catch (e) {
		next(e);
	}
};

const deleteItem = async (
	{ params }: Request,
	res: Response,
	next: NextFunction,
) => {
	try {
		const { id } = params;
		const response = await deleteScout(id);

		if (!response) {
			throw new AppError({
				name: "NOT_FOUND",
				description: "Scout not found",
				httpCode: HttpCode.NOT_FOUND,
			});
		}

		res.send(response);
	} catch (e) {
		next(e);
	}
};

export { getItem, getItems, insertItem, updateItem, deleteItem };
