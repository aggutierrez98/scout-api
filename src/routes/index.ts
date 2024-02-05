import { Router } from "express";
import { readdirSync } from "fs";
import { cleanFileName } from "../utils";

const router = Router();

export default (async () => {
	const PATH_ROUTER = `${__dirname}`;
	const paths = readdirSync(PATH_ROUTER).filter((fileName) => cleanFileName(fileName) !== "index")
	for (const path of paths) {
		// import(`./${path}`)
		// 	.then(({ default: createRouter }) => {
		// 		router.use(`/${path}`, createRouter());
		// 		console.log(router)
		// 	});

		const { default: createRouter } = await import(`./${path}`)
		router.use(`/${path}`, createRouter());
	}

	console.log(router)
	return router
})()