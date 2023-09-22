import { z } from "zod";
import { numberReg } from "./regex";

export const IdSchema = z.string().regex(numberReg);

export const QuerySearchSchema = z.object({
	offset: z.string().regex(numberReg).optional(),
	limit: z.string().regex(numberReg).optional(),
});