import { Router } from "express";

import {
	deleteItem,
	getItem,
	getItems,
	insertItem,
	updateItem,
} from "../controllers/scout";
const router = Router();

router.get("/", getItems);
router.get("/:id", getItem);
router.post("/", insertItem);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);

export { router };
