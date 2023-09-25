import { z } from "zod";
import { nanoIdRegex, numberReg } from "../utils/regex";

export const IdSchema = z.string().regex(nanoIdRegex);
export const QuerySearchSchema = z.object({
	offset: z.string().regex(numberReg).optional(),
	limit: z.string().regex(numberReg).optional(),
});
