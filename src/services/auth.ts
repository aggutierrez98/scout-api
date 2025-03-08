import { IUser, IUserData, IScout, IScoutData, ROLES, IFamiliar } from '../types';
import { nanoid } from "nanoid";
import { encrypt, verified } from "../utils/lib/bcrypt.util";
import { generateToken } from "../utils/lib/jwt.util";
import { RolesType } from "../types";
import { getAge } from "../utils";
import { prismaClient } from "../utils/lib/prisma-client";

const prisma = prismaClient.$extends({
    result: {
        user: {
            id: {
                compute: (data) => data.uuid,
            },
            uuid: {
                compute: () => undefined,
            },
        },
        scout: {
            id: {
                compute: (data) => data.uuid,
            },
            uuid: {
                compute: () => undefined,
            },
            edad: {
                needs: { fechaNacimiento: true },
                compute(scout: IScout) {
                    return getAge(scout.fechaNacimiento)
                },
            }
        },
        familiar: {
            id: {
                compute: (data) => data.uuid,
            },
            uuid: {
                compute: () => undefined,
            },
            edad: {
                needs: { fechaNacimiento: true },
                compute(familiar: IFamiliar) {
                    return getAge(familiar.fechaNacimiento)
                },
            }
        }
    },
});


const UserModel = prisma.user;

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

        const user = await UserModel.findUnique({
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

        return {
            id: user.id,
            username: user.username,
            scout: user.scout,
            familiar: user.familiar,
            role: user.role,
            active: user.active
        }
    }

    getUsers = async ({
        limit = 15,
        offset = 0,
        filters = {},
    }: queryParams) => {
        const {
            nombre = "",
            username = ""
        } = filters;

        const response = await UserModel.findMany({
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

        return response.map(user => ({
            id: user.id,
            username: user.username,
            role: user.role,
            active: user.active
        }))
    }

    loginUser = async ({ password, username }: LoginParams) => {

        const user = await UserModel.findUnique({
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

        const token = generateToken(user.id)
        return {
            id: user.id,
            username: user.username,
            scout: user.scout as IScoutData,
            familiar: user.familiar as IFamiliar,
            role: user.role as RolesType,
            token,
        }
    };

    createUser = async ({ password, username, scoutId, familiarId, role }: CreateParams) => {
        const uuid = nanoid(10);
        const newPassword = password ? await encrypt(password) : undefined

        const user = await UserModel.create({
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

        return {
            id: user.id,
            scout: user.scout as IScoutData,
            familiar: user.familiar as IFamiliar,
            username: user.username,
            role: user.role as RolesType,
        }
    }

    createUAdminUser = async ({ password, username, scoutId }: CreateAdminParams) => {
        const uuid = nanoid(10);
        const passHash = await encrypt(password)

        const user = await UserModel.create({
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

        const token = generateToken(user.id)
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

        const user = await UserModel.update({
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

        return {
            id: user.id,
            scout: user.scout,
            familiar: user.familiar,
            username: user.username,
            role: user.role,
            active: user.active
        }
    }

}
