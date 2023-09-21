import {
	VALID_FUNCTIONS,
	VALID_INSINGIAS_TYPE,
	VALID_RELATIONSHIPS,
	VALID_SEX,
} from "../utils";
import {
	VALID_GET_SCOUTS_FILTERS,
	VALID_PROGRESSIONS,
	VALID_RELIGIONS,
} from "../utils";

// ENTITIES Types
export type RelacionFamiliarType = typeof VALID_RELATIONSHIPS[number];
export type ReligionType = typeof VALID_RELIGIONS[number];
export type SexoType = typeof VALID_SEX[number];
export type ProgresionType = typeof VALID_PROGRESSIONS[number];
export type FuncionType = typeof VALID_FUNCTIONS[number];
export type TipoInsigniaType = typeof VALID_INSINGIAS_TYPE[number];

// PARAMS Types
export type OrderToGetScouts = typeof VALID_GET_SCOUTS_FILTERS[number];
