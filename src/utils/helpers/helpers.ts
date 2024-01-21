import { Request, Response } from "express";
import compression from "compression";
const NO_COMPRESS_HEADERS = ["x-no-compression"];

export const parseDMYtoDate = (string: string) => {
	const [d, m, y] = string.split(/\D/);
	// return new Date(Number(`${y}`), Number(m) - 1, Number(d));
	return new Date(Number(`${y.length === 2 ? "20" : ""}${y}`), Number(m) - 1, Number(d));
};

export const excelDateToJSDate = (serial: number) => {
	const utc_days = Math.floor(serial - 25568);
	const utc_value = utc_days * 86400;
	const date_info = new Date(utc_value * 1000);

	return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(),);
}

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

export const getAge = (birthDate: Date) => Math.floor((new Date().getTime() - new Date(birthDate).getTime()) / 3.15576e+10)