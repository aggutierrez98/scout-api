import { z } from "zod";
import { IScout } from "../interfaces/scout.interface";

const numberReg = /^[0-9]/;
const lettersReg = /^[a-zA-Z]/;
const directionReg = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const ScoutSchema = z.object({
	nombre: z.string().max(100).regex(lettersReg),
	apellido: z.string().max(100).regex(lettersReg),
	fechaNacimiento: z.date(),
	dni: z.string().max(10).regex(numberReg),
	sexo: z.enum(["M", "F"]),
	localidad: z.string().max(100).regex(lettersReg),
	direccion: z.string().max(100).regex(directionReg),
	telefono: z.string().max(15).regex(numberReg),
	mail: z.string().min(1).email(),
	progresion: z.enum(["PISTA", "RUMBO", "TRAVESIA"]),
	religion: z.enum(["CATOLICA", "JUDIA", "BUDISTA", "EVANGELICA"]),
	patrullaId: z.number().max(10),
	Funcion: z.enum(["JOVEN", "JEFE", "SUBJEFE", "AYUDANTE", "COLABORADOR"]),
	progresionActual: z.enum(["PISTA", "RUMBO", "TRAVESIA"]),
}) satisfies z.Schema<IScout>;
