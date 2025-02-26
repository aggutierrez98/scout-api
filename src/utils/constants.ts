export const VALID_PROGRESSIONS = [
	"INTERRAMA",
	"PISTA",
	"RUMBO",
	"TRAVESIA",
] as const;
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
	"VIUDO"
] as const;
export const VALID_FUNCTIONS = [
	"JOVEN",
	"ACOMPAÑANTE",
	"AYUDANTE_RAMA",
	"SUBJEFE_RAMA",
	"JEFE_RAMA",
	"SUBJEFE_GRUPO",
	"JEFE_GRUPO",
	"PADRE_REPRESENTANTE",
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
	"OTRO",
] as const;

export const VALID_ENTREGAS_TYPE = [
	"UNIFORME",
	"GUIA",
	"SUBGUIA",
	"PROGPISTA",
	"PROGRUMBO",
	"PROGTRAVESIA",
	"PROMESA",
	"ESPNATURALEZA",
	"ESPARTE",
	"ESPSERVICIO",
	"ESPESPIRITUALIDAD",
	"ESPDEPORTES",
	"ESPCIENCIA",
	"SUPERACION",
] as const;

export const VALID_RAMAS = [
	"CASTORES",
	"MANADA",
	"SCOUTS",
	"CAMINANTES",
	"ROVERS"
] as const;

export enum EntregaFromEntregaType {
	UNIFORME = "Uniforme Scout",
	INSG_GUIA = "Insignia de Guia de patrulla",
	INSG_SUBGUIA = "Insignia de Subguia de patrulla",
	PROG_PISTA = "Insignia de progresion PISTA",
	PROG_RUMBO = "Insignia de progresion RUMBO",
	PROG_TRAVESIA = "Insignia de progresion TRAVESIA",
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

export const VALID_ROLES = [
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
] as const

export enum ROLES {
	JOVEN = "JOVEN",
	COLABORADOR = "COLABORADOR",
	ACOMPAÑANTE = "ACOMPAÑANTE",
	AYUDANTE_RAMA = "AYUDANTE_RAMA",
	SUBJEFE_RAMA = "SUBJEFE_RAMA",
	JEFE_RAMA = "JEFE_RAMA",
	SUBJEFE_GRUPO = "SUBJEFE_GRUPO",
	JEFE_GRUPO = "JEFE_GRUPO",
	PADRE_REPRESENTANTE = "PADRE_REPRESENTANTE",
	ADMINISTRADOR = "ADMINISTRADOR",
}

export const VALID_ESTADOS = [
	"ACTIVO",
	"INACTIVO",
] as const

export const MENU_COMMANDS = ["pagos", "documentos", "scouts", "familiares", "entregas", "cumpleaños"]

export const SPLIT_STRING = process.env.NODE_ENV === "development" ? " " : ", "

// Number or proxies to skip to limit ips requests by rate-limiter
export const PROXIES_NUMBER = 1;

// If you add origins they will be the only accepted by CORS
export const ACCEPTED_ORIGINS: String[] = [];

export const FUNCIONES_MAP = {
	"Asist. Zonal Actividades Seguras": "ACOMPAÑANTE",
	"Asist. Zonal Comunicaciones Institucionales": "ACOMPAÑANTE",
	"Acompañante": "ACOMPAÑANTE",
	"Sub-Jefe de Grupo": "SUBJEFE_GRUPO",
	"Jefe de Grupo": "JEFE_GRUPO",
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
	"Castor": "JOVEN",
	"Lobato / Lobezna": "JOVEN",
	"Scout": "JOVEN",
	"Caminante": "JOVEN",
	"Rover": "JOVEN",
	"Representante Juvenil al Consejo de Grupo": "JOVEN",
}

export type DOCUMENTOS_NAMES = "Caratula legajo" | "Autorizacion de uso de imagen" | "Autorizacion para retiro de jovenes" | "Autorizacion ingreso de menores de edad" | "Autorizacion de salidas cercanas";

export const DOCUMENTOS_POSITIONS: Record<DOCUMENTOS_NAMES, { x: number, y: number }> = {
	"Caratula legajo": {
		x: 0,
		y: 0
	},
	"Autorizacion de uso de imagen": {
		x: 0,
		y: 0
	},
	"Autorizacion para retiro de jovenes": {
		x: 0,
		y: 0
	},
	"Autorizacion ingreso de menores de edad": {
		x: 0,
		y: 0
	},
	"Autorizacion de salidas cercanas": {
		x: 275,
		y: 330
	},
}


export enum PDFDocumentsEnum {
	CaratulaLegajo = "Caratula legajo",
	AutorizacionUsoImagen = "Autorizacion de uso de imagen",
	AutorizacionRetiro = "Autorizacion para retiro de jovenes",
	AutorizacionIngresoMenores = "Autorizacion ingreso de menores de edad",
	AutorizacionSalidasCercanas = "Autorizacion de salidas cercanas",
}
