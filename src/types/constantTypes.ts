import {
	VALID_FUNCTIONS,
	VALID_ENTREGAS_TYPE,
	VALID_METODOS_PAGO,
	VALID_RELATIONSHIPS,
	VALID_ROLES,
	VALID_SEX,
	VALID_GET_SCOUTS_FILTERS,
	VALID_PROGRESSIONS,
	VALID_RELIGIONS,
	VALID_ESTADO_CIVIL,
	VALID_ESTADOS,
	VALID_RAMAS,
	VALID_TIPOS_EVENTO
} from "../utils";

// ENTITIES Types
export type RelacionFamiliarType = typeof VALID_RELATIONSHIPS[number];
export type EstadoCivilType = typeof VALID_ESTADO_CIVIL[number];
export type ReligionType = typeof VALID_RELIGIONS[number];
export type EstadosType = typeof VALID_ESTADOS[number];
export type SexoType = typeof VALID_SEX[number];
export type ProgresionType = typeof VALID_PROGRESSIONS[number];
export type FuncionType = typeof VALID_FUNCTIONS[number];
export type TipoEntregaType = typeof VALID_ENTREGAS_TYPE[number];
export type MetodosPagoType = typeof VALID_METODOS_PAGO[number];
export type RolesType = typeof VALID_ROLES[number];
export type RamasType = typeof VALID_RAMAS[number];
export type TipoEventoType = typeof VALID_TIPOS_EVENTO[number];

// PARAMS Types
export type OrderToGetScouts = typeof VALID_GET_SCOUTS_FILTERS[number];


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
	AutorizacionEventos = "Autorizacion para salidas acantonamientos campamentos",
}


export enum ROLES {
	EXTERNO = "EXTERNO",
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