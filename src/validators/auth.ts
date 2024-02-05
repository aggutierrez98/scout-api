import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { IUser } from "../types";
import { lettersReg } from "../utils/regex";
import { validScoutID } from "./scout";
import { IdSchema, QuerySearchSchema } from "./generics";
import { VALID_ROLES } from "../utils";

const passRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,12}$/

export const alreadyExistsUser = async (username: string) => {
    const prisma = new PrismaClient();
    const UserModel = prisma.user;
    const respItem = await UserModel.findUnique({
        where: { username },
    });
    return !respItem;
};

export const validUserID = async (id: string) => {
    const prisma = new PrismaClient();
    const UserModel = prisma.user;
    const respItem = await UserModel.findUnique({
        where: { uuid: id },
    });
    return !!respItem;
};

export const UserSchema = z.object({
    username: z.string(),
    password: z.string(),

}) satisfies z.Schema<IUser>;


export const LoginSchema = z.object({
    body: UserSchema,
});

export const RegisterSchema = z.object({
    body: UserSchema.extend({
        // scoutId: IdSchema.refine(validScoutID),
        username: z.string().min(8, { message: "El nombre de usuario debe tener al menos 8 caracteres" }).max(20, { message: "El nombre de usuario debe tener como maximo 20 caracteres" }).regex(lettersReg, { message: "El nombre de usuario solo puede contener letras" }).refine(alreadyExistsUser, "El nombre de usuario se encuentra en uso"),
        password: z.string().regex(passRegex, { message: "La contraseña debe tener entre 8 y 12 caracteres, al menos una letra mayúscula, una letra minúscula y un número" }),
        role: z.enum(VALID_ROLES).optional()
    })
});

export const ModifySchema = z.object({
    body: z.object({
        active: z.boolean().optional(),
        role: z.enum(VALID_ROLES).optional(),
    }),
    params: z.object({
        id: IdSchema.refine(validUserID),
    })
});

export const GetUsersSchema = z.object({
    query: QuerySearchSchema.extend({
        nombre: z.union([z.string().regex(lettersReg), z.literal("")]),
    }),
});

export const GetUserSchema = z.object({
    params: z.object({
        id: IdSchema.refine(validUserID),
    }),
});
