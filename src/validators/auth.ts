import { z } from "zod";
import { IUser } from "../types";
import { lettersReg } from "../utils/regex";
import { IdSchema, QuerySearchSchema } from "./generics";
import { VALID_ROLES } from "../utils";
import { prismaClient } from "../utils/lib/prisma-client";
import { validFamiliarID } from "./familiar";
import { validScoutID } from "./scout";

const passRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,12}$/

export const alreadyExistsUser = async (username: string) => {
    const UserModel = prismaClient.user;
    const respItem = await UserModel.findUnique({
        where: { username },
    });
    return !respItem;
};

export const validUserID = async (id: string) => {
    const UserModel = prismaClient.user;
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
        username: z.string().min(8, { message: "El nombre de usuario debe tener al menos 8 caracteres" }).max(20, { message: "El nombre de usuario debe tener como maximo 20 caracteres" }).regex(lettersReg, { message: "El nombre de usuario solo puede contener letras" }).refine(alreadyExistsUser, "El nombre de usuario se encuentra en uso"),
        password: z.string().regex(passRegex, { message: "La contraseña debe tener entre 8 y 12 caracteres, al menos una letra mayúscula, una letra minúscula y un número" }).optional(),
        role: z.enum(VALID_ROLES).optional(),
        familiarId: IdSchema.refine(validFamiliarID).optional(),
        scoutId: IdSchema.refine(validScoutID).optional(),
    })
});

export const ModifySchema = z.object({
    body: z.object({
        active: z.boolean().optional(),
        role: z.enum(VALID_ROLES).optional(),
        password: z.string().regex(passRegex, { message: "La contraseña debe tener entre 8 y 12 caracteres, al menos una letra mayúscula, una letra minúscula y un número" }).optional(),
    }),
    params: z.object({
        id: IdSchema.refine(validUserID),
    })
});

export const FirstLoginSchema = z.object({
    body: z.object({
        password: z.string().regex(passRegex, { message: "La contraseña debe tener entre 8 y 12 caracteres, al menos una letra mayúscula, una letra minúscula y un número" }).optional(),
        username: z.string({ message: "Se debe enviar un nombre de usuario para validar su existencia" })
    }),
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
