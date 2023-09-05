import swaggerJSDoc, { OAS3Definition, OAS3Options } from "swagger-jsdoc";
// import { ProgresionType } from "../interfaces/types";

const swaggerDefinition: OAS3Definition = {
	openapi: "3.0.0",
	info: {
		title: "Scout API Documentation",
		version: "1.0.0",
	},
	servers: [
		{
			url: "http://localhost:8080",
		},
	],
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
			},
		},
		schemas: {
			scout: {
				$ref: "./schemas/scout.yml",
			},
			documentos: {
				$ref: "./schemas/documento.yml",
			},
			patrulla: {
				$ref: "./schemas/patrulla.yml",
			},
			familiar: {
				$ref: "./schemas/familiar.yml",
			},
			insignias: {
				$ref: "./schemas/insignia.yml",
			},
		},
		// schemas: {
		// 	scout: {
		// 		type: "object",
		// 		properties: {
		// 			id: {
		// 				type: "string",
		// 				readOnly: true,
		// 			},
		// 			nombre: {
		// 				type: "string",
		// 			},
		// 			apellido: {
		// 				type: "string",
		// 			},
		// 			fechaNacimiento: {
		// 				type: "date",
		// 			},
		// 			dni: {
		// 				type: "string",
		// 			},
		// 			sexo: {
		// 				type: "string",
		// 				enum: ["M", "F"],
		// 			},
		// 			localidad: {
		// 				type: "string",
		// 			},
		// 			direccion: {
		// 				type: "string",
		// 			},
		// 			telefono: {
		// 				type: "string",
		// 			},
		// 			mail: {
		// 				type: "string",
		// 			},
		// 			progresionActual: {
		// 				type: "string",
		// 				enum: ["PISTA", "RUMBO", "TRAVESIA"],
		// 			},
		// 			religion: {
		// 				type: "string",
		// 				enum: ["CATOLICA", "JUDIA", "BUDISTA", "EVANGELICA"],
		// 			},
		// 			Funcion: {
		// 				type: "string",
		// 				enum: ["JOVEN", "JEFE", "SUBJEFE", "AYUDANTE", "COLABORADOR"],
		// 			},
		// 			patrullaId: {
		// 				type: "string",
		// 				writeOnly: true,
		// 			},
		// 			patrulla: {
		// 				readOnly: true,
		// 				$ref: "#/components/schemas/patrulla",
		// 			},
		// 			documentosPresentados: {
		// 				type: "array",
		// 				readOnly: true,
		// 				items: {
		// 					$ref: "#/components/schemas/documentos",
		// 				},
		// 			},
		// 			insigniasObtenidas: {
		// 				type: "array",
		// 				readOnly: true,
		// 				items: {
		// 					$ref: "#/components/schemas/insignias",
		// 				},
		// 			},
		// 			familiares: {
		// 				type: "array",
		// 				readOnly: true,
		// 				items: {
		// 					$ref: "#/components/schemas/familiar",
		// 				},
		// 			},
		// 			fechaCreacion: { type: "date", readOnly: true },
		// 			fechaActualizacion: { type: "date", readOnly: true },
		// 		},
		// 		required: [
		// 			"nombre",
		// 			"apellido",
		// 			"fechaNacimiento",
		// 			"dni",
		// 			"sexo",
		// 			"localidad",
		// 			"direccion",
		// 		],
		// 	},
		// 	patrulla: {
		// 		type: "object",
		// 		properties: {
		// 			id: {
		// 				type: "string",
		// 				readOnly: true,
		// 			},
		// 			nombre: {
		// 				type: "string",
		// 			},
		// 			lema: {
		// 				type: "string",
		// 			},
		// 			scouts: {
		// 				type: "array",
		// 				readOnly: true,
		// 				items: {
		// 					$ref: "#/components/schemas/scout",
		// 				},
		// 			},
		// 			fechaCreacion: {
		// 				type: "date",
		// 				readOnly: true,
		// 			},
		// 		},
		// 		required: ["nombre", "lema"],
		// 	},
		// 	documentos: {
		// 		type: "object",
		// 		properties: {
		// 			id: { type: "string", readOnly: true },
		// 			// Scout: { readOnly: true, $ref: "#/components/schemas/scout" },
		// 			nombre: { type: "string" },
		// 			vence: { type: "boolean" },
		// 			fechaPresentacion: { type: "date" },
		// 		},
		// 		required: ["nombre", "vence"],
		// 	},
		// 	insignias: {
		// 		type: "object",
		// 		properties: {
		// 			id: { type: "string", readOnly: true },
		// 			// Scout: { readOnly: true, $ref: "#/components/schemas/scout" },
		// 			// scoutId: { type: "string", writeOnly: true },
		// 			scouts: {
		// 				type: "array",
		// 				readOnly: true,
		// 				items: {
		// 					$ref: "#/components/schemas/scout",
		// 				},
		// 			},
		// 			tipoInsignia: {
		// 				type: "string",
		// 				enum: [
		// 					"UNIFORME",
		// 					"GUIA",
		// 					"SUBGUIA",
		// 					"PROGRESION",
		// 					"PROMESA",
		// 					"ESPNATURALEZA",
		// 					"ESPARTE",
		// 					"ESPECSERVICIO",
		// 					"ESPESPIRITUALIDAD",
		// 					"ESPDEPORTES",
		// 					"ESPCIENCIA",
		// 					"SUPERACION",
		// 				],
		// 			},
		// 			progresion: {
		// 				type: "string",
		// 				enum: ["PISTA", "RUMBO", "TRAVESIA"],
		// 			},
		// 			fechaObtencion: { type: "date", readOnly: true },
		// 		},
		// 		required: ["scouts", "tipoInsignia", "fechaObtencion"],
		// 	},
		// 	familiar: {
		// 		type: "object",
		// 		properties: {
		// 			id: { type: "string", readOnly: true },
		// 			nombre: { type: "string" },
		// 			apellido: {
		// 				type: "string",
		// 			},
		// 			fechaNacimiento: {
		// 				type: "date",
		// 			},
		// 			dni: {
		// 				type: "string",
		// 			},
		// 			sexo: {
		// 				type: "string",
		// 				enum: ["M", "F"],
		// 			},
		// 			telefono: {
		// 				type: "string",
		// 			},
		// 			relacion: {
		// 				type: "string",
		// 				enum: [
		// 					"PADRE",
		// 					"MADRE",
		// 					"TIO",
		// 					"TIA",
		// 					"HERMANO",
		// 					"HERMANA",
		// 					"OTRO",
		// 				],
		// 			},
		// 			fechaCreacion: { type: "date", readOnly: true },
		// 			fechaActualizacion: { type: "date", readOnly: true },
		// 			scout: {
		// 				type: "array",
		// 				items: {
		// 					$ref: "#/components/schemas/scout",
		// 				},
		// 				readOnly: true,
		// 			},
		// 		},
		// 		required: [
		// 			"nombre",
		// 			"apellido",
		// 			"fechaNacimiento",
		// 			"dni",
		// 			"sexo",
		// 			"relacion",
		// 		],
		// 	},
		// },
	},
};

const swaggerOptions: OAS3Options = {
	swaggerDefinition,
	apis: ["./src/routes/*.ts"],
	// definition: {
	// 	components: {
	// 		schemas:
	// 	}
	// }
};

export default swaggerJSDoc(swaggerOptions);
