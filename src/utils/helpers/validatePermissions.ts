import { RolesType } from "../../types";
import { VALID_ROLES } from "../constants";
import { ADMIN_PERM, COLABORADOR_PERM, EDUCADOR_PERM, EXTERNO_PERM, JEFE_PERM } from "../permissions";

export type HTTPMethods = keyof typeof actionsFromMethods;

enum actionsFromMethods {
    POST = "create",
    GET = "read",
    PUT = "modify",
    DELETE = "delete",
}

interface Params {
    userRole?: RolesType;
    resource: string;
    method: HTTPMethods;
}

const validators = {
    roles: VALID_ROLES,
    grants: {
        ADMIN: ADMIN_PERM,
        JEFE: JEFE_PERM,
        EDUCADOR: EDUCADOR_PERM,
        COLABORADOR: COLABORADOR_PERM,
        EXTERNO: EXTERNO_PERM,
    }
}

export const validatePermissions = ({ method, resource, userRole }: Params) => {
    if (!userRole) return false

    const action = actionsFromMethods[method]
    const permission = `${action}_${resource}`

    const isAllowed = validators.grants[userRole].includes(permission)
    return isAllowed
}


export const isPublicRoute = ({ method, resource }: Params) => {
    const action = actionsFromMethods[method]
    const permission = `${action}_${resource}`
    const isPublic = validators.grants["COLABORADOR"].includes(permission)
    return isPublic
}