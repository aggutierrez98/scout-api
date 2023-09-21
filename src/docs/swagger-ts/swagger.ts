import { OAS3Definition } from "swagger-jsdoc";
import { scoutSchema } from "./schemas/scout";
import { patrullaSchema } from "./schemas/patrulla";
import { insigniaSchema } from "./schemas/insignia";
import { familiarSchema } from "./schemas/familiar";
import { documentoSchema } from "./schemas/documento";
import {
	getScouts,
	getScout,
	createScout,
	updateScout,
	deleteScout,
} from "./resources/scouts";

const swaggerDefinition: OAS3Definition = {
	openapi: "3.0.0",
	info: {
		title: "Scout API Documentation",
		version: "1.0.0",
	},
	servers: [
		{
			url: "http://localhost:8080/api",
		},
	],
	paths: {
		scout: {
			get: getScouts,
			post: createScout,
		},
		"scout/{id}": {
			get: getScout,
			put: updateScout,
			delete: deleteScout,
		},
	},
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
			},
		},
		schemas: {
			scout: scoutSchema,
			patrulla: patrullaSchema,
			documento: documentoSchema,
			insignia: insigniaSchema,
			familiar: familiarSchema,
		},
	},
};

export { swaggerDefinition };
