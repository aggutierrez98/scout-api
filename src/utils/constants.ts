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
	"JEFE",
	"SUBJEFE",
	"AYUDANTE",
	"COLABORADOR",
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
	"UNIDAD",
	"CAMINANTES",
	"ROVERS"
] as const;

export enum EntregaFromEntregaType {
	UNIFORME = "Uniforme Scout",
	GUIA = "Insignia de Guia de patrulla",
	SUBGUIA = "Insignia de Subguia de patrulla",
	PROGPISTA = "Insignia de progresion PISTA",
	PROGRUMBO = "Insignia de progresion RUMBO",
	PROGTRAVESIA = "Insignia de progresion TRAVESIA",
	PROMESA = "Insignia de Promesa",
	ESPNATURALEZA = "Especialidad de Vida en la naturaleza",
	ESPARTE = "Especialidad de Arte, Expresión y Cultura",
	ESPSERVICIO = "Especialidad de Servicio a los demás",
	ESPESPIRITUALIDAD = "Especialidad de Espiritualidad",
	ESPDEPORTES = "Especialidad de Deportes",
	ESPCIENCIA = "Especialidad de Ciencia y Tecnología",
	SUPERACION = "Insignia de Maxima Superacion",

}

export const VALID_SEX = ["M", "F"] as const;

export const VALID_METODOS_PAGO = [
	"EFECTIVO",
	"TRANSFERENCIA",
	"OTRO",
] as const;

export const VALID_ROLES = [
	"ADMIN",
	"JEFE",
	"EDUCADOR",
	"COLABORADOR",
	"EXTERNO",
] as const
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