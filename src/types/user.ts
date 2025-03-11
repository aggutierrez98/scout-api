import { RolesType } from "./constantTypes";
import { IFamiliar } from "./familiar";
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
    role: RolesType
    familiar: IFamiliar | null
}


export type UsuarioXLSX = {
    DNI: string
    UserId: string
}


export type Notification = {
    id: string,
    message: string,
    read: boolean
}

export interface NotifactionsResponse {
    notifications: Notification[]
    unreadCount: number
}