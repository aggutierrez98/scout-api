import { FuncionType, RamasType, RolesType } from "../../types"
import { FUNCION_TO_ROLE_MAP, FUNCIONES_MAP, RAMAS_MAP } from '../constants';

export const getFuncion = (funcion?: string) => {
    return (FUNCIONES_MAP[funcion as keyof typeof FUNCIONES_MAP]?.toLocaleUpperCase() as FuncionType) || "ACOMPAÑANTE"
}

export const getRoleFromFuncion = (funcion?: string) => {
    return (FUNCION_TO_ROLE_MAP[funcion as keyof typeof FUNCION_TO_ROLE_MAP]?.toLocaleUpperCase() as RolesType) || "EXTERNO"
}

export const getRamaFromNomina = (rama?: string) => {
    return (RAMAS_MAP[rama as keyof typeof RAMAS_MAP]?.toLocaleUpperCase() as RamasType)
}