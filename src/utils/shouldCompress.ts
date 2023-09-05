import { Request, Response } from "express";
import compression from "compression";
const NO_COMPRESS_HEADERS = ["x-no-compression"];

export default function shouldCompress(req: Request, res: Response) {
	if (
		Object.keys(req.headers).find((header) =>
			NO_COMPRESS_HEADERS.includes(header),
		)
	)
		return false;
	return compression.filter(req, res);
}
