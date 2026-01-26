import { Familiar, Scout, User } from "@prisma/client";
import { getAge } from "../utils";
import { RolesType } from "../types";

export const mapUser = (user: User & { scout?: Scout; familiar?: Familiar }) => ({
    id: user.uuid,
    username: user.username,
    scout: user.scout
        ? {
            ...user.scout,
            id: user.scout.uuid,
            edad: getAge(user.scout.fechaNacimiento),
        }
        : null,
    familiar: user.familiar
        ? {
            ...user.familiar,
            id: user.familiar.uuid,
            edad: getAge(user.familiar.fechaNacimiento),
        }
        : null,
    role: user.role as RolesType,
    active: user.active,
});