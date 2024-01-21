import { OAS3Options } from "swagger-jsdoc";
import { VALID_ENTREGAS_TYPE } from "../../../utils";

export const entregaSchema: OAS3Options = {
	type: "object",
	properties: {
		id: { type: "string", readOnly: true },
		scouts: {
			type: "array",
			readOnly: true,
			items: {
				$ref: "#/components/schemas/scout",
			},
		},
		tipoEntrega: {
			type: "string",
			enum: VALID_ENTREGAS_TYPE,
		},
		fechaObtencion: { type: "date", readOnly: true },
	},
	required: ["scouts", "tipoInsignia", "fechaObtencion"],
};
