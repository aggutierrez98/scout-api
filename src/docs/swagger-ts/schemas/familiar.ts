import { OAS3Options } from "swagger-jsdoc";
import { VALID_RELATIONSHIPS, VALID_SEX } from "../../../utils";

export const familiarSchema: OAS3Options = {
	type: "object",
	properties: {
		id: { type: "string", readOnly: true },
		nombre: { type: "string" },
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
		telefono: {
			type: "string",
		},
		relacion: {
			type: "string",
			enum: VALID_RELATIONSHIPS,
		},
		fechaCreacion: { type: "date", readOnly: true },
		fechaActualizacion: { type: "date", readOnly: true },
		scouts: {
			type: "array",
			readOnly: true,
			items: {
				$ref: "#/components/schemas/scout",
			},
		},
	},
	required: [
		"nombre",
		"apellido",
		"fechaNacimiento",
		"dni",
		"sexo",
		"relacion",
	],
};
