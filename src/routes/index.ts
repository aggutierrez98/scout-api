import { Router } from "express";
import { readdirSync } from "fs";
import { cleanFileName } from "../utils";

const PATH_ROUTER = `${__dirname}`;
const router = Router();

readdirSync(PATH_ROUTER).filter((fileName) => {
	const cleanName = cleanFileName(fileName);
	if (cleanName !== "index") {
		import(`./${cleanName}`).then(({ createRouter }) => {
			router.use(`/${cleanName}`, createRouter());
		});
	}
});

export default router;
