
export const EXTERNO_PERM = [
    "read_scout",
    "read_patrulla",
    "read_documento",
    "read_pago",
    "read_auth"
]
export const COLABORADOR_PERM = [
    ...EXTERNO_PERM,
    "read_familiar",
    "create_pago",
    "create_documento",
    "modify_pago",
    "modify_documento"
]
export const EDUCADOR_PERM = [
    ...COLABORADOR_PERM,
    "create_scout",
    "create_patrulla",
    "create_familiar",
    "modify_patrulla",
    "modify_familiar",
    "delete_patrulla",
    "delete_documento",
    "delete_pago",
]
export const JEFE_PERM = [
    ...EDUCADOR_PERM,
    "modify_scout",
    "delete_scout",
    "delete_familiar",
]
export const ADMIN_PERM = [
    ...JEFE_PERM,
    "create_auth",
    "modify_auth"
]
