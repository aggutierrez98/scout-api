export default {
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
			enum: ["M", "F"],
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
			enum: ["PISTA", "RUMBO", "TRAVESIA"],
		},
		religion: {
			type: "string",
			enum: ["CATOLICA", "JUDIA", "BUDISTA", "EVANGELICA"],
		},
		Funcion: {
			type: "string",
			enum: ["JOVEN", "JEFE", "SUBJEFE", "AYUDANTE", "COLABORADOR"],
		},
		patrullaId: {
			type: "string",
			writeOnly: true,
		},
		patrulla: {
			readOnly: true,
			$ref: "#/components/schemas/patrulla",
		},
		documentosPresentados: {
			type: "array",
			readOnly: true,
			items: {
				$ref: "#/components/schemas/documentos",
			},
		},
		insigniasObtenidas: {
			type: "array",
			readOnly: true,
			items: {
				$ref: "#/components/schemas/insignias",
			},
		},
		familiares: {
			type: "array",
			readOnly: true,
			items: {
				$ref: "#/components/schemas/familiar",
			},
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
