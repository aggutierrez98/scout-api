import { FuncionType } from "../../types"
import { FUNCIONES_MAP } from '../constants';

export const getFuncion = (funcion: keyof typeof FUNCIONES_MAP) => {
    return (FUNCIONES_MAP[funcion]?.toLocaleUpperCase() as FuncionType) || "COLABORADOR"
}