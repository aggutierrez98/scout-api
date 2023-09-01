export * from "./error";
export * from "./log";
export * from "./session";

// // import { NextFunction } from "express";
// // import { readdirSync } from "fs";
// // const PATH_ROUTER = `${__dirname}`;

// // type MiddlewareFunction = (
// // 	req: Request,
// // 	res: Response,
// // 	next: NextFunction,
// // ) => Promise<void>;

// // type MiddlewareObject = { [key: string]: MiddlewareFunction };

// // const cleanFileName = (fileName: string) => {
// // 	const file = fileName.split(".").shift();
// // 	return file;
// // };

// // let middlewares: { [key: string]: MiddlewareFunction } = {};

// // readdirSync(PATH_ROUTER).filter((fileName) => {
// // 	const cleanName = cleanFileName(fileName);
// // 	if (cleanName && cleanName !== "index") {
// // 		import(`./${cleanName}`).then((functions: MiddlewareObject) => {
// // 			console.log(functions);
// // 			middlewares = { ...middlewares, ...functions };
// // 		});
// // 	}
// // });

// // export default middlewares;
