import { OAS3Options } from "swagger-jsdoc";
import { VALID_INSINGIAS_TYPE, VALID_PROGRESSIONS } from "../../../utils";

export const insigniaSchema: OAS3Options = {
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
		tipoInsignia: {
			type: "string",
			enum: VALID_INSINGIAS_TYPE,
		},
		progresion: {
			type: "string",
			enum: VALID_PROGRESSIONS,
		},
		fechaObtencion: { type: "date", readOnly: true },
	},
	required: ["scouts", "tipoInsignia", "fechaObtencion"],
};
