import { IScoutData } from "./scout";

export interface IUser {
    username: string,
    password?: string
}
export interface IUserData {
    id: string;
    username: string,
    token: unknown,
    scout: IScoutData | null
    role: string
}

export type UsuarioXLSX = {
    DNI: string
    UserId: string
}
