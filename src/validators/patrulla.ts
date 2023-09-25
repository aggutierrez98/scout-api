import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { IPatrulla } from "../types";
import { ScoutSchema } from "./scout";
import { IdSchema } from "./generics";

const validPatrullaId = async (id: string) => {
	const prisma = new PrismaClient();
	const ParullaModel = prisma.patrulla;
	const respItem = await ParullaModel.findUnique({ where: { id: Number(id) } });
	return !!respItem;
};

export const PatrullaSchema = z.object({
	id: z.number(),
	nombre: z.string().max(45),
	lema: z.string().max(100).nullable(),
	fechaCreacion: z.date(),
	Scouts: z.array(ScoutSchema).optional(),
}) satisfies z.Schema<IPatrulla>;

export const GetPatrullasSchema = z.object({});

export const GetPatrullaSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validPatrullaId),
	}),
});

export const PostPatrullaSchema = z.object({
	body: PatrullaSchema,
});

export const PutPatrullaSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validPatrullaId),
	}),
	body: PatrullaSchema.deepPartial(),
});

export const DeletePatrullaSchema = z.object({
	params: z.object({
		id: IdSchema.refine(validPatrullaId),
	}),
});
