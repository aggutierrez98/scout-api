import { IUser, IUserData, IScout, IScoutData, ROLES, IFamiliar } from '../types';
import { nanoid } from "nanoid";
import { encrypt, verified } from "../utils/lib/bcrypt.util";
import { generateToken } from "../utils/lib/jwt.util";
import { RolesType } from "../types";
import { getAge } from "../utils";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapUser } from '../mappers/auth';
interface LoginParams {
    username: string;
    password: string
}
interface GetUserParams {
    username?: string;
    userId?: string,
    hasLoggedIn?: boolean
}
interface CreateParams {
    username: string;
    password?: string
    scoutId?: string
    familiarId?: string
    role?: RolesType
}

interface CreateAdminParams {
    username: string;
    password: string
    scoutId?: string
}

interface ModifyParams {
    active?: boolean
    role?: RolesType
    userId: string
    password?: string
}

interface queryParams {
    limit?: number;
    offset?: number;
    filters?: {
        nombre?: string;
        username?: string;
    };
};

interface IAuthService {
    loginUser: (userData: LoginParams) => Promise<IUserData | null>;
    createUser: (userData: CreateParams) => Promise<Omit<IUserData, "token"> | null>;
    getUser: (userData: GetUserParams) => Promise<IUser | null>;
}

export class AuthService implements IAuthService {
    getUser = async ({ username, userId, hasLoggedIn = true }: GetUserParams) => {
        const hasLoggedInFilter = hasLoggedIn ? { password: { not: null } } : { password: { equals: null } }

        const user = await prismaClient.user.findUnique({
            where: {
                OR: [{ username }, { uuid: userId }],
                username,
                uuid: userId,
                ...hasLoggedInFilter,
            },
            include: {
                scout: true,
                familiar: true
            }
        })

        if (!user) return null

        const userScout = mapUser({
            ...user,
            scout: user.scout ?? undefined,
            familiar: user.familiar ?? undefined
        })

        return {
            ...userScout,
            active: user.active
        }
    }

    getUsers = async ({
        limit,
        offset = 0,
        filters = {},
    }: queryParams) => {
        const {
            nombre = "",
            username = ""
        } = filters;

        const response = await prismaClient.user.findMany({
            skip: offset,
            take: limit,
            orderBy: { username: "asc" },
            where: {
                OR: [
                    {
                        scout: {
                            nombre: {
                                contains: nombre,
                            }
                        }

                    },
                    {
                        scout: {
                            apellido: {
                                contains: nombre,
                            }
                        }
                    },
                    {
                        username: {
                            contains: nombre,
                        }
                    },
                    {
                        username: {
                            equals: username,
                        }
                    },
                ],


            },
        });

        return response.map(user => {

            const userScout = mapUser({
                ...user,
            })

            return {
                id: userScout.id,
                username: userScout.username,
                role: userScout.role,
                active: userScout.active
            }
        })
    }

    loginUser = async ({ password, username }: LoginParams) => {

        const user = await prismaClient.user.findUnique({
            where: {
                username
            },
            include: {
                scout: true,
                familiar: true
            }
        })
        if (!user || !user.password) return null

        const validPass = await verified(password, user.password)
        if (!validPass) return null

        const userScout = mapUser({
            ...user,
            scout: user.scout ?? undefined,
            familiar: user.familiar ?? undefined
        })
        const token = generateToken(userScout.id)
        return {
            ...userScout,
            token
        }
    };

    createUser = async ({ password, username, scoutId, familiarId, role }: CreateParams) => {
        const uuid = nanoid(10);
        const newPassword = password ? await encrypt(password) : undefined

        const user = await prismaClient.user.create({
            data: {
                uuid,
                username,
                password: newPassword,
                scoutId: scoutId,
                familiarId: familiarId,
                role
            },
            include: {
                scout: true,
                familiar: true
            }
        });

        const userScout = mapUser({
            ...user,
            scout: user.scout ?? undefined,
            familiar: user.familiar ?? undefined
        })

        return {
            ...userScout,
            role: userScout.role as RolesType,
        }
    }

    createUAdminUser = async ({ password, username, scoutId }: CreateAdminParams) => {
        const uuid = nanoid(10);
        const passHash = await encrypt(password)

        const user = await prismaClient.user.create({
            data: {
                uuid,
                username,
                password: passHash,
                scoutId: scoutId,
                role: ROLES.ADMINISTRADOR
            },
            include: {
                scout: true
            }
        });

        const userScout = mapUser({
            ...user,
            scout: user.scout ?? undefined,
        })

        const token = generateToken(userScout.id)
        return {
            id: user.id,
            scout: user.scout,
            username: user.username,
            role: user.role,
            token
        }
    }

    modifyUser = async ({ active, role, userId, password }: ModifyParams) => {

        const modifiedPassword = password ? await encrypt(password) : undefined

        const user = await prismaClient.user.update({
            data: {
                active,
                role,
                password: modifiedPassword
            },
            where: {
                uuid: userId,
            },
            include: {
                scout: true,
                familiar: true
            }
        })

        const userScout = mapUser({
            ...user,
            scout: user.scout ?? undefined,
            familiar: user.familiar ?? undefined
        })

        return {
            ...userScout,
            active: user.active
        }
    }

}
