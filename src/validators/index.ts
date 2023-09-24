import { z } from "zod";
import { numberReg } from "../utils/regex";

export * from "./scout";
export * from "./patrulla";
export * from "./documento";
export * from "./pago";

export const IdSchema = z.string().regex(numberReg);

export const QuerySearchSchema = z.object({
	offset: z.string().regex(numberReg).optional(),
	limit: z.string().regex(numberReg).optional(),
});
