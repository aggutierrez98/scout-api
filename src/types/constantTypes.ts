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
	VALID_RAMAS
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

// PARAMS Types
export type OrderToGetScouts = typeof VALID_GET_SCOUTS_FILTERS[number];
