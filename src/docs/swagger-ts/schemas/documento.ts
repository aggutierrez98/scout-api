import { OAS3Options } from "swagger-jsdoc";

export const documentoSchema: OAS3Options = {
	type: "object",
	properties: {
		id: { type: "string", readOnly: true },
		Scout: { readOnly: true, $ref: "#/components/schemas/scout" },
		nombre: { type: "string" },
		vence: { type: "boolean" },
		fechaPresentacion: { type: "date" },
	},
	required: ["nombre", "vence"],
};
