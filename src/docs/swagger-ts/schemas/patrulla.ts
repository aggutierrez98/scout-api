import { OAS3Options } from "swagger-jsdoc";

export const patrullaSchema: OAS3Options = {
	type: "object",
	properties: {
		id: {
			type: "string",
			readOnly: true,
		},
		nombre: {
			type: "string",
		},
		lema: {
			type: "string",
		},
		scouts: {
			type: "array",
			readOnly: true,
			items: {
				$ref: "#/components/schemas/scout",
			},
		},
		fechaCreacion: {
			type: "date",
			readOnly: true,
		},
	},
	required: ["nombre", "lema"],
};
