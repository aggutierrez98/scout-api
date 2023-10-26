import { z } from "zod";

export const errorMap: z.ZodErrorMap = (error, ctx) => {
	if (error.message) return { message: error.message };

	switch (error.code) {
		case z.ZodIssueCode.invalid_type:
			if (error.expected === "string") {
				return { message: "Debe ser un texto valido" };
			}
			if (error.expected === "number") {
				return { message: "Debe ser un numero valido" };
			}
			break;

		case z.ZodIssueCode.custom: {
			if (ctx.defaultError === "Invalid input") {

				if (error.path.length === 2) {
					return {
						message: `El Parametro ${error.path[1]} '${ctx.data}' no esta registrado en el sistema`,
					};
				}
			}
			break;
		}

		case z.ZodIssueCode.invalid_enum_value: {
			return {
				message: `Valor enviado es invalido. Valores validos: [${error.options}]`,
			};
		}

		case z.ZodIssueCode.invalid_string: {

			console.log("aca loco")

			return {
				message: `El valor enviado '${ctx.data}' no tiene el formato valido.`,
			};
		}
	}

	return { message: ctx.defaultError };
};
