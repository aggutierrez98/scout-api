export const VALID_PROGRESSIONS = [
	"INTERRAMA",
	"LOBO_PATA_TIERNA",
	"LOBO_SALTADOR",
	"LOBO_RASTREADOR",
	"LOBO_CAZADOR",
	"PISTAS",
	"SENDA",
	"RUMBO",
	"TRAVESIA",
	"FUEGO",
	"TIERRA",
	"AGUA",
	"AIRE",
	"ENCUENTRO",
	"COMPROMISO",
	"PROYECCION",
] as const;

export const PROGRESIONES_POR_RAMA = {
	CASTORES: [],
	MANADA: [
		"INTERRAMA",
		"LOBO_PATA_TIERNA",
		"LOBO_SALTADOR",
		"LOBO_RASTREADOR",
		"LOBO_CAZADOR",
	],
	SCOUTS: ["INTERRAMA", "PISTAS", "SENDA", "RUMBO", "TRAVESIA"],
	CAMINANTES: ["INTERRAMA", "FUEGO", "TIERRA", "AGUA", "AIRE"],
	ROVERS: ["ENCUENTRO", "COMPROMISO", "PROYECCION"],
} as const;
export const VALID_RELIGIONS = [
	"CATOLICA",
	"JUDIA",
	"BUDISTA",
	"EVANGELICA",
] as const;
export const VALID_ESTADO_CIVIL = [
	"CASADO",
	"SOLTERO",
	"SEPARADO",
	"VIUDO",
] as const;
export const VALID_FUNCTIONS = [
	"JOVEN",
	"ACOMPAÑANTE",
	"COLABORADOR",
	"AYUDANTE_RAMA",
	"SUBJEFE_RAMA",
	"JEFE_RAMA",
	"SUBJEFE_GRUPO",
	"JEFE_GRUPO",
	"PADRE_REPRESENTANTE",
	"FAMILIAR",
] as const;
export const VALID_GET_SCOUTS_FILTERS = [
	"apellido",
	"dni",
	"fechaNacimiento",
] as const;

export const VALID_RELATIONSHIPS = [
	"PADRE",
	"MADRE",
	"TIO",
	"TIA",
	"HERMANO",
	"HERMANA",
	"ABUELO",
	"ABUELA",
	'TUTOR',
] as const;

export const VALID_ENTREGAS_TYPE = [
	"PROG_MANADA_INTERRAMA",
	"PROG_MANADA_LOBO_PATA_TIERNA",
	"PROG_MANADA_LOBO_SALTADOR",
	"PROG_MANADA_LOBO_RASTREADOR",
	"PROG_MANADA_LOBO_CAZADOR",
	"PROG_SCOUTS_INTERRAMA",
	"PROG_SCOUTS_PISTAS",
	"PROG_SCOUTS_SENDA",
	"PROG_SCOUTS_RUMBO",
	"PROG_SCOUTS_TRAVESIA",
	"PROG_CAMINANTES_INTERRAMA",
	"PROG_CAMINANTES_FUEGO",
	"PROG_CAMINANTES_TIERRA",
	"PROG_CAMINANTES_AGUA",
	"PROG_CAMINANTES_AIRE",
	"PROG_ROVERS_ENCUENTRO",
	"PROG_ROVERS_COMPROMISO",
	"PROG_ROVERS_PROYECCION",
	"UNIFORME",
	"PROMESA",
	"INSG_GUIA",
	"INSG_SUBGUIA",
] as const;

export const VALID_RAMAS = [
	"CASTORES",
	"MANADA",
	"SCOUTS",
	"CAMINANTES",
	"ROVERS",
] as const;

export enum EntregaFromEntregaType {
	UNIFORME = "Uniforme Scout",
	INSG_GUIA = "Insignia de Guia de patrulla",
	INSG_SUBGUIA = "Insignia de Subguia de patrulla",
	PROG_MANADA_INTERRAMA = "Etapa de progresion MANADA - INTERRAMA",
	PROG_MANADA_LOBO_PATA_TIERNA = "Etapa de progresion MANADA - LOBO PATA TIERNA",
	PROG_MANADA_LOBO_SALTADOR = "Etapa de progresion MANADA - LOBO SALTADOR",
	PROG_MANADA_LOBO_RASTREADOR = "Etapa de progresion MANADA - LOBO RASTREADOR",
	PROG_MANADA_LOBO_CAZADOR = "Etapa de progresion MANADA - LOBO CAZADOR",
	PROG_SCOUTS_INTERRAMA = "Etapa de progresion SCOUTS - INTERRAMA",
	PROG_SCOUTS_PISTAS = "Etapa de progresion SCOUTS - PISTAS",
	PROG_SCOUTS_SENDA = "Etapa de progresion SCOUTS - SENDA",
	PROG_SCOUTS_RUMBO = "Etapa de progresion SCOUTS - RUMBO",
	PROG_SCOUTS_TRAVESIA = "Etapa de progresion SCOUTS - TRAVESIA",
	PROG_CAMINANTES_INTERRAMA = "Etapa de progresion CAMINANTES - INTERRAMA",
	PROG_CAMINANTES_FUEGO = "Etapa de progresion CAMINANTES - FUEGO",
	PROG_CAMINANTES_TIERRA = "Etapa de progresion CAMINANTES - TIERRA",
	PROG_CAMINANTES_AGUA = "Etapa de progresion CAMINANTES - AGUA",
	PROG_CAMINANTES_AIRE = "Etapa de progresion CAMINANTES - AIRE",
	PROG_ROVERS_ENCUENTRO = "Etapa de progresion ROVERS - ENCUENTRO",
	PROG_ROVERS_COMPROMISO = "Etapa de progresion ROVERS - COMPROMISO",
	PROG_ROVERS_PROYECCION = "Etapa de progresion ROVERS - PROYECCION",
	PROMESA = "Insignia de Promesa",
	ESP_NATURALEZA = "Especialidad de Vida en la naturaleza",
	ESP_ARTE = "Especialidad de Arte, Expresión y Cultura",
	ESP_SERVICIO = "Especialidad de Servicio a los demás",
	ESP_ESPIRITUALIDAD = "Especialidad de Espiritualidad",
	ESP_DEPORTES = "Especialidad de Deportes",
	ESP_CIENCIA = "Especialidad de Ciencia y Tecnología",
	MAX_SUPERACION = "Insignia de Maxima Superacion",
}

export const VALID_SEX = ["M", "F"] as const;

export const VALID_METODOS_PAGO = [
	"EFECTIVO",
	"TRANSFERENCIA",
	"OTRO",
] as const;

export const VALID_TIPOS_PAGO = [
	"AFILIACION",
	"CUOTA_MENSUAL",
	"CUOTA_MENSUAL_TODO_JUNTO",
	"EVENTO",
	"OTRO",
] as const;

export const VALID_ROLES = [
	"EXTERNO",
	"JOVEN",
	"COLABORADOR",
	"ACOMPAÑANTE",
	"AYUDANTE_RAMA",
	"SUBJEFE_RAMA",
	"JEFE_RAMA",
	"SUBJEFE_GRUPO",
	"JEFE_GRUPO",
	"PADRE_REPRESENTANTE",
	"ADMINISTRADOR",
] as const;

export const FUNCION_TO_ROLE_MAP = {
	JOVEN: "JOVEN",
	COLABORADOR: "COLABORADOR",
	ACOMPAÑANTE: "ACOMPAÑANTE",
	AYUDANTE_RAMA: "AYUDANTE_RAMA",
	SUBJEFE_RAMA: "SUBJEFE_RAMA",
	JEFE_RAMA: "JEFE_RAMA",
	SUBJEFE_GRUPO: "SUBJEFE_GRUPO",
	JEFE_GRUPO: "JEFE_GRUPO",
	PADRE_REPRESENTANTE: "PADRE_REPRESENTANTE",
} as const;

export const FUNCIONES_MAP = {
	"Asist. Zonal Actividades Seguras": "ACOMPAÑANTE",
	"Asist. Zonal Comunicaciones Institucionales": "ACOMPAÑANTE",
	Acompañante: "ACOMPAÑANTE",
	"Sub-Jefe de Grupo": "SUBJEFE_GRUPO",
	"Jefe/a de Grupo": "JEFE_GRUPO",
	"Ayudante de Castores": "AYUDANTE_RAMA",
	"Ayudante de Manada": "AYUDANTE_RAMA",
	"Ayudante de Unidad Scout": "AYUDANTE_RAMA",
	"Ayudante de Comunidad Caminante": "AYUDANTE_RAMA",
	"Ayudante de Comunidad Rover": "AYUDANTE_RAMA",
	"Sub-Jefe de Castores": "SUBJEFE_RAMA",
	"Sub-Jefe de Manada": "SUBJEFE_RAMA",
	"Sub-Jefe de Unidad Scout": "SUBJEFE_RAMA",
	"Sub-Jefe de Comunidad Caminante": "SUBJEFE_RAMA",
	"Sub-Jefe de Comunidad Rover": "SUBJEFE_RAMA",
	"Jefe de Castores": "JEFE_RAMA",
	"Jefe de Manada": "JEFE_RAMA",
	"Jefe de Unidad Scout": "JEFE_RAMA",
	"Jefe de Comunidad Caminante": "JEFE_RAMA",
	"Jefe de Comunidad Rover": "JEFE_RAMA",
	"Padre representante Castores": "PADRE_REPRESENTANTE",
	"Padre representante Manada": "PADRE_REPRESENTANTE",
	"Padre representante Unidad Scout": "PADRE_REPRESENTANTE",
	"Padre representante Comunidad Caminante": "PADRE_REPRESENTANTE",
	"Padre representante Comunidad Rover": "PADRE_REPRESENTANTE",
	Castor: "JOVEN",
	"Lobato / Lobezna": "JOVEN",
	Scout: "JOVEN",
	Caminante: "JOVEN",
	Rover: "JOVEN",
	"Representante Juvenil al Consejo de Grupo": "JOVEN",
	"Equipo de Apoyo": "COLABORADOR",
};

export const RAMAS_MAP = {
	Castores: "CASTORES",
	"Lobatos y Lobeznas": "MANADA",
	Scouts: "SCOUTS",
	Caminantes: "CAMINANTES",
	Rovers: "ROVERS",
} as const;

export const VALID_TIPOS_EVENTO = [
	"SALIDA",
	"ACANTONAMIENTO",
	"CAMPAMENTO",
] as const;

export const VALID_TIPOS_PARTICIPANTE = [
	"JOVEN_PROTAGONISTA",
	"EDUCADOR",
] as const;

export const VALID_TIPOS_AVISO = [
	"CUMPLEAÑOS",
	"PAGO_PENDIENTE",
	"DOCUMENTO_PENDIENTE",
	"EVENTO",
	"CUSTOM",
] as const;

export const VALID_REFERENCIA_TIPOS = ["scout", "familiar", "pago", "evento"] as const;

export const VALID_ESTADOS = ["ACTIVO", "INACTIVO"] as const;

export const MENU_COMMANDS = [
	"pagos",
	"documentos",
	"scouts",
	"familiares",
	"entregas",
	"cumpleaños",
];
export const SPLIT_STRING = process.env.NODE_ENV === "development" ? " " : ", ";

// If you add origins they will be the only accepted by CORS
export const ACCEPTED_ORIGINS: string[] = [];
// Number or proxies to skip to limit ips requests by rate-limiter
export const PROXIES_NUMBER = 1;
