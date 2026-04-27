
export const FAMILIAR_PERM = [
    "read_scout",
    "read_familiar",
    "read_equipo",
    "read_documento",
    "read_pago",
    "read_entrega",
    "read_auth",
    "read_notificacion",
    "modify_notificacion",
    "create_documento",
    "read_evento",
]

export const AYUDANTE_PERM = [
    ...FAMILIAR_PERM,
    "read_tipo-evento",
    "create_entrega",
    "modify_entrega",
    "modify_documento",
    "create_equipo",
    "modify_equipo",
    "delete_equipo",
    "create_familiar",
    "modify_familiar",
    "create_notificacion",
]

export const EXTERNO_PERM = [
    "read_scout",
    "read_familiar",
    "read_equipo",
    "read_documento",
    "read_pago",
    "read_entrega",
    "read_auth",
    "read_notificacion",
    "modify_notificacion",
    "create_documento",
    "read_evento",
    "read_tipo-evento",
]
export const COLABORADOR_PERM = [
    ...EXTERNO_PERM,
    "create_pago",
    "create_documento",
    "modify_pago",
    "modify_documento"
]
export const EDUCADOR_PERM = [
    ...COLABORADOR_PERM,
    "create_scout",
    "create_equipo",
    "create_familiar",
    "create_entrega",
    "create_notificacion",
    "modify_entrega",
    "modify_equipo",
    "modify_familiar",
    "delete_equipo",
    "delete_documento",
    "delete_pago",
]
export const JEFE_PERM = [
    ...EDUCADOR_PERM,
    "modify_scout",
    "delete_scout",
    "delete_familiar",
    "delete_entrega",
    "create_evento",
    "modify_evento",
    "delete_evento",
]
export const ADMIN_PERM = [
    ...JEFE_PERM,
    "create_auth",
    "modify_auth",
    "create_nomina",
    "create_tipo-evento",
    "modify_tipo-evento",
    "delete_tipo-evento",
    "create_admin",
]
