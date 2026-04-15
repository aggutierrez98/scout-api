import { z } from "zod";

const CruzDelSurMemberSchema = z.object({
	tipoDocumento: z.string(),
	documento: z.string().min(1),
	nombre: z.string().min(1),
	apellido: z.string().optional(),
	sexo: z.string().optional(),
	fechaNacimiento: z.string().optional(),
	provincia: z.string().optional(),
	localidad: z.string().optional(),
	calle: z.string().optional(),
	codigoPostal: z.string().optional(),
	estadoCivil: z.string().optional(),
	telefono: z.string().optional(),
	email: z.string().optional(),
	religion: z.string().optional(),
	religionDescripcion: z.string().optional(),
	estudios: z.string().optional(),
	titulo: z.string().optional(),
	empresa: z.string().optional(),
	discapacidad: z.string().optional(),
	detalleDiscapacidad: z.string().optional(),
	nacionalidad: z.string().optional(),
	funcion: z.string().optional(),
	categoria: z.string().optional(),
	rama: z.string().optional(),
	zona: z.string().optional(),
	distrito: z.string().optional(),
	codigo: z.string().optional(),
	organismo: z.string().optional(),
	fechaPrimerAfiliacion: z.string().optional(),
});

export const PostNominaWebhookSchema = z.object({
	body: z.object({
		event: z.literal("members.exported"),
		timestamp: z.string(),
		total: z.number().int().nonnegative(),
		trigger: z.enum(["scheduled", "on-demand"]),
		data: z.array(CruzDelSurMemberSchema),
	}),
});
