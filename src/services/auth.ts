import { PrismaClient, Prisma } from "@prisma/client";
import { IUser, IUserData, IScout } from '../types/interfaces';
import { nanoid } from "nanoid";
import { encrypt, verified } from "../utils/lib/bcrypt.util";
import { generateToken } from "../utils/lib/jwt.util";
import { RolesType } from "../types";
import { getAge } from "../utils";


const prisma = new PrismaClient().$extends({
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
    userId?: string
}
interface CreateParams extends LoginParams {
    scoutId: string
    role?: RolesType
}
interface ModifyParams {
    active?: boolean
    role?: RolesType
    userId: string
}

interface queryParams {
    limit?: number;
    offset?: number;
    filters?: {
        nombre?: string;
    };
};

interface IAuthService {
    loginUser: (userData: LoginParams) => Promise<IUserData | null>;
    createUser: (userData: CreateParams) => Promise<IUserData | null>;
    getUser: (userData: GetUserParams) => Promise<IUser | null>;
}

export class AuthService implements IAuthService {
    getUser = async ({ username, userId }: GetUserParams) => {
        const user = await UserModel.findUnique({
            where: {
                OR: [{ username }, { uuid: userId }],
                username,
                uuid: userId
            },
            include: {
                scout: true
            }
        })
        if (!user) return null

        return {
            id: user.id,
            username: user.username,
            scout: user.scout,
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
                scout: true
            }
        })
        if (!user) return null

        const validPass = await verified(password, user.password)
        if (!validPass) return null

        const token = generateToken(user.id)
        return {
            id: user.id,
            username: user.username,
            scout: user.scout,
            role: user.role,
            token,
        }
    };

    createUser = async ({ password, username, scoutId, role }: CreateParams) => {
        const uuid = nanoid(10);
        const passHash = await encrypt(password)

        const user = await UserModel.create({
            data: {
                uuid,
                username,
                password: passHash,
                scoutId: scoutId,
                role
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

    createUAdminUser = async ({ password, username, scoutId }: CreateParams) => {
        const uuid = nanoid(10);
        const passHash = await encrypt(password)

        const user = await UserModel.create({
            data: {
                uuid,
                username,
                password: passHash,
                scoutId: scoutId,
                role: "ADMIN"
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

    modifyUser = async ({ active, role, userId }: ModifyParams) => {

        const user = await UserModel.update({
            data: {
                active,
                role
            },
            where: {
                uuid: userId,
            },
            include: {
                scout: true
            }
        })

        return {
            id: user.id,
            scout: user.scout,
            username: user.username,
            role: user.role,
            active: user.active
        }
    }

}
