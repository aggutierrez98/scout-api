import { OAS3Options } from "swagger-jsdoc";

export const getScouts: OAS3Options = {
	tags: ["scouts"],
	summary: "Read Scouts data",
	parameters: [
		{
			in: "query",
			name: "limit",
			schema: {
				type: "string",
			},
		},
		{
			in: "query",
			name: "offset",
			schema: {
				type: "string",
			},
		},
		{
			in: "query",
			name: "order",
			schema: {
				type: "string",
			},
		},
	],
	responses: {
		200: {
			description: "Returns objects from collection.",
		},
		400: {
			description: "User input error.",
		},
	},
};

export const createScout: OAS3Options = {
	tags: ["scouts"],
	summary: "Create Scout in repository with given data",
	requestBody: {
		required: true,
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/scout",
				},
				example: {
					nombre: "Roberto",
					apellido: "Williams",
					fechaNacimiento: "1990-05-15",
					dni: "1234567890",
					sexo: "M",
					localidad: "Cityville",
					direccion: "123 Main Street",
					telefono: "555-123-4567",
					mail: "Roberto.Williams@example.com",
					progresionActual: "RUMBO",
					religion: "CATOLICA",
					Funcion: "JOVEN",
					equipoId: "2",
				},
			},
		},
	},
	responses: {
		200: {
			description: "Returns object inserted in collection.",
		},
		400: {
			description: "User input error.",
		},
	},
};

export const getScout: OAS3Options = {
	tags: ["scouts"],
	summary: "Read Specific Scout data",
	parameters: [
		{
			in: "path",
			name: "id",
			required: true,
			schema: {
				type: "number",
			},
		},
	],
	responses: {
		200: {
			description: "Returns one object from collection.",
		},
		400: {
			description: "User input error.",
		},
	},
};

export const getAllScouts: OAS3Options = {
	tags: ["scouts"],
	summary: "Read all Scouts ids",
	parameters: [
		{
			in: "path",
			name: "id",
			required: true,
			schema: {
				type: "number",
			},
		},
	],
	responses: {
		200: {
			description: "Returns one object from collection.",
		},
		400: {
			description: "User input error.",
		},
	},
};
export const getAllEducadores: OAS3Options = {
	tags: ["scouts"],
	summary: "Read Specific Scout data",
	parameters: [
		{
			in: "path",
			name: "id",
			required: true,
			schema: {
				type: "number",
			},
		},
	],
	responses: {
		200: {
			description: "Returns one object from collection.",
		},
		400: {
			description: "User input error.",
		},
	},
};

export const updateScout: OAS3Options = {
	tags: ["scouts"],
	summary: "Update Specific Scout in repository with given data",
	parameters: [
		{
			in: "path",
			name: "id",
			required: true,
			schema: {
				type: "number",
			},
		},
	],
	requestBody: {
		required: false,
		content: {
			"application/json": {
				schema: {
					$ref: "#/components/schemas/scout",
				},
				example: {
					nombre: "RobertoNUEVONOMBRE",
					mail: "Roberto.WilliamsNUEVOMAIL@example.com",
					progresionActual: "PISTA",
					religion: "JUDIA",
					Funcion: "EDUCADOR",
					equipoId: null,
				},
			},
		},
	},
	responses: {
		200: {
			description: "Returns object updated in collection.",
		},
		400: {
			description: "User input error.",
		},
	},
};

export const deleteScout: OAS3Options = {
	tags: ["scouts"],
	summary: "Delete Specific Scout from repository",
	parameters: [
		{
			in: "path",
			name: "id",
			required: true,
			schema: {
				type: "number",
			},
		},
	],
	responses: {
		200: {
			description: "Returns object deleted from collection.",
		},
		400: {
			description: "User input error.",
		},
	},
};
