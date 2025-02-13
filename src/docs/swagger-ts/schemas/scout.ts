import { OAS3Options } from "swagger-jsdoc";
import {
	VALID_FUNCTIONS,
	VALID_PROGRESSIONS,
	VALID_RELIGIONS,
	VALID_SEX,
} from "../../../utils";

export const scoutSchema: OAS3Options = {
	type: "object",
	properties: {
		id: {
			type: "string",
			readOnly: true,
		},
		nombre: {
			type: "string",
		},
		apellido: {
			type: "string",
		},
		fechaNacimiento: {
			type: "date",
		},
		dni: {
			type: "string",
		},
		sexo: {
			type: "string",
			enum: VALID_SEX,
		},
		localidad: {
			type: "string",
		},
		direccion: {
			type: "string",
		},
		telefono: {
			type: "string",
		},
		mail: {
			type: "string",
		},
		progresionActual: {
			type: "string",
			enum: VALID_PROGRESSIONS,
		},
		religion: {
			type: "string",
			enum: VALID_RELIGIONS,
		},
		Funcion: {
			type: "string",
			enum: VALID_FUNCTIONS,
		},
		equipoId: {
			type: "string",
			writeOnly: true,
		},
		equipo: {
			readOnly: true,
			$ref: "#/components/schemas/equipo",
		},
		documentosPresentados: {
			type: "array",
			readOnly: true,
			items: {
				$ref: "#/components/schemas/documento",
			},
		},
		insigniasObtenidas: {
			type: "array",
			readOnly: true,
			items: {
				$ref: "#/components/schemas/insignia",
			},
		},
		familiares: {
			type: "array",
			readOnly: true,
			items: {
				$ref: "#/components/schemas/familiar",
			},
		},
		user: {
			$ref: "#/components/schemas/User"
		},
		userId: {
			type: "string",
			maxLength: 10,
			uniqueItems: true,
			writeOnly: true,
		},
		fechaCreacion: { type: "date", readOnly: true },
		fechaActualizacion: { type: "date", readOnly: true },
	},
	required: [
		"nombre",
		"apellido",
		"fechaNacimiento",
		"dni",
		"sexo",
		"localidad",
		"direccion",
	],
};
