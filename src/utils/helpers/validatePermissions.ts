import { RolesType } from "../../types";
import { VALID_ROLES } from "../constants";
import { ADMIN_PERM, COLABORADOR_PERM, EDUCADOR_PERM, EXTERNO_PERM, JEFE_PERM } from '../permissions';

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
        JOVEN: EXTERNO_PERM,
        COLABORADOR: COLABORADOR_PERM,
        ACOMPAÑANTE: COLABORADOR_PERM,
        PADRE_REPRESENTANTE: COLABORADOR_PERM,
        AYUDANTE_RAMA: EDUCADOR_PERM,
        SUBJEFE_RAMA: EDUCADOR_PERM,
        JEFE_RAMA: JEFE_PERM,
        SUBJEFE_GRUPO: JEFE_PERM,
        JEFE_GRUPO: JEFE_PERM,
        ADMINISTRADOR: ADMIN_PERM,
    }
}

export const validatePermissions = ({ method, resource, userRole }: Params) => {
    if (!userRole) return false

    const action = actionsFromMethods[method]
    const permission = `${action}_${resource}`

    const isAllowed = validators.grants[userRole].includes(permission)
    return isAllowed
}

