import { OAS3Definition } from "swagger-jsdoc";
import { scoutSchema } from "./schemas/scout";
import { equipoSchema } from "./schemas/equipo";
import { entregaSchema } from "./schemas/entrega";
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
		"allScouts": {
			get: getScout,
		},
		"allEducadores": {
			get: getScout,
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
			equipo: equipoSchema,
			documento: documentoSchema,
			entrega: entregaSchema,
			familiar: familiarSchema,
		},
	},
};

export { swaggerDefinition };
