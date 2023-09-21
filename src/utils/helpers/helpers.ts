import { Request, Response } from "express";
import compression from "compression";
const NO_COMPRESS_HEADERS = ["x-no-compression"];

export const parseDMYtoDate = (string: string) => {
	const [d, m, y] = string.split(/\D/);
	return new Date(Number(y), Number(m) - 1, Number(d));
};

export const cleanFileName = (fileName: string) => {
	const file = fileName.split(".").shift();
	return file;
};

export const shouldCompress = (req: Request, res: Response) => {
	if (
		Object.keys(req.headers).find((header) =>
			NO_COMPRESS_HEADERS.includes(header),
		)
	)
		return false;
	return compression.filter(req, res);
};
