import { CruzDelSurMember, NominaSyncResult } from "../types/nomina";
import { prismaClient } from "../utils/lib/prisma-client";
import { AppError, HttpCode } from "../utils";
import { RAMAS_MAP, FUNCIONES_MAP } from "../utils/constants";
import logger from "../utils/classes/Logger";

// Normaliza el sexo de cruz-del-sur al formato del sistema ("M" o "F")
function normalizeSexo(sexo?: string): string | undefined {
	if (!sexo) return undefined;
	const s = sexo.trim().toLowerCase();
	if (s === "m" || s === "masculino") return "M";
	if (s === "f" || s === "femenino") return "F";
	return undefined;
}

// Normaliza un string de fecha al objeto Date de JS.
// cruz-del-sur puede enviar "DD/MM/YYYY" o "YYYY-MM-DD".
function parseDate(dateStr?: string): Date | undefined {
	if (!dateStr) return undefined;

	// Formato DD/MM/YYYY
	const ddmmyyyyMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
	if (ddmmyyyyMatch) {
		return new Date(`${ddmmyyyyMatch[3]}-${ddmmyyyyMatch[2]}-${ddmmyyyyMatch[1]}`);
	}

	// Formato YYYY-MM-DD (o ISO)
	const parsed = new Date(dateStr);
	return isNaN(parsed.getTime()) ? undefined : parsed;
}

// Mapea la rama de cruz-del-sur a la rama del sistema
function mapRama(rama?: string): string | undefined {
	if (!rama) return undefined;
	return (RAMAS_MAP as Record<string, string>)[rama] ?? undefined;
}

// Mapea la función de cruz-del-sur a la función del sistema
function mapFuncion(funcion?: string): string | undefined {
	if (!funcion) return undefined;
	return (FUNCIONES_MAP as Record<string, string>)[funcion] ?? undefined;
}

export class NominaService {
	/**
	 * Llama a la API de cruz-del-sur para obtener la nómina actual.
	 * Usado en sincronización on-demand y por el cron job.
	 */
	pullNomina = async (): Promise<CruzDelSurMember[]> => {
		const apiUrl = process.env.CRUZ_DEL_SUR_API_URL;
		const apiKey = process.env.CRUZ_DEL_SUR_API_KEY;

		if (!apiUrl || !apiKey) {
			throw new AppError({
				name: "CRUZ_DEL_SUR_NOT_CONFIGURED",
				description: "Variables CRUZ_DEL_SUR_API_URL o CRUZ_DEL_SUR_API_KEY no configuradas",
				httpCode: HttpCode.INTERNAL_SERVER_ERROR,
			});
		}

		const response = await fetch(`${apiUrl}/members`, {
			method: "GET",
			headers: {
				"x-api-key": apiKey,
				"Content-Type": "application/json",
			},
			signal: AbortSignal.timeout(30_000),
		});

		if (!response.ok) {
			throw new AppError({
				name: "CRUZ_DEL_SUR_API_ERROR",
				description: `Error al consultar cruz-del-sur: HTTP ${response.status}`,
				httpCode: HttpCode.INTERNAL_SERVER_ERROR,
			});
		}

		const json = await response.json() as { data: CruzDelSurMember[]; total: number };
		return json.data;
	};

	/**
	 * Sincroniza un array de miembros de la nómina con los scouts de nuestro sistema.
	 *
	 * Reglas:
	 * - Scout encontrado en la nómina → se actualiza sus datos + estado = "ACTIVO"
	 * - Scout en nuestro sistema que NO aparece en la nómina → estado = "INACTIVO"
	 * - Miembro de la nómina sin match en nuestro sistema → se registra en el log, no se crea
	 */
	syncNomina = async (members: CruzDelSurMember[]): Promise<NominaSyncResult> => {
		const result: NominaSyncResult = {
			procesados: members.length,
			actualizados: 0,
			desactivados: 0,
			noEncontrados: 0,
			errores: 0,
			timestamp: new Date().toISOString(),
		};

		if (members.length === 0) {
			logger.warn("[NominaService] syncNomina: nómina vacía recibida, abortando sync");
			return result;
		}

		// DNIs presentes en la nómina (normalizados a string)
		const nominaDnis = new Set(members.map((m) => m.documento.trim()));

		// 1. Actualizar scouts que aparecen en la nómina
		for (const member of members) {
			try {
				const dni = member.documento.trim();

				const scout = await prismaClient.scout.findUnique({
					where: { dni },
					select: { uuid: true },
				});

				if (!scout) {
					logger.info(`[NominaService] Sin match para DNI ${dni} (${member.nombre} ${member.apellido ?? ""})`);
					result.noEncontrados++;
					continue;
				}

				// Construir objeto de actualización con los campos disponibles
				const updateData: Record<string, unknown> = {
					estado: "ACTIVO",
				};

				if (member.nombre) updateData.nombre = member.nombre;
				if (member.apellido) updateData.apellido = member.apellido;
				if (member.telefono) updateData.telefono = member.telefono;
				if (member.email) updateData.mail = member.email;
				if (member.localidad) updateData.localidad = member.localidad;
				if (member.calle) updateData.direccion = member.calle;
				if (member.provincia) updateData.provincia = member.provincia;
				if (member.nacionalidad) updateData.nacionalidad = member.nacionalidad;
				if (member.religion) updateData.religion = member.religion;

				const sexoMapped = normalizeSexo(member.sexo);
				if (sexoMapped) updateData.sexo = sexoMapped;

				const ramaMapped = mapRama(member.rama);
				if (ramaMapped) updateData.rama = ramaMapped;

				const funcionMapped = mapFuncion(member.funcion);
				if (funcionMapped) updateData.funcion = funcionMapped;

				const fechaNac = parseDate(member.fechaNacimiento);
				if (fechaNac) updateData.fechaNacimiento = fechaNac;

				await prismaClient.scout.update({
					where: { uuid: scout.uuid },
					data: updateData,
				});

				result.actualizados++;
			} catch (err) {
				logger.error(`[NominaService] Error actualizando scout documento=${member.documento}: ${(err as Error).message}`);
				result.errores++;
			}
		}

		// 2. Marcar como INACTIVO a los scouts activos que no están en la nómina
		try {
			const { count } = await prismaClient.scout.updateMany({
				where: {
					estado: "ACTIVO",
					dni: { notIn: Array.from(nominaDnis) },
				},
				data: { estado: "INACTIVO" },
			});
			result.desactivados = count;
		} catch (err) {
			logger.error(`[NominaService] Error desactivando scouts ausentes en nómina: ${(err as Error).message}`);
			result.errores++;
		}

		logger.info(`[NominaService] Sync completado ${JSON.stringify(result)}`);
		return result;
	};

	/**
	 * Pull + sync en un solo paso. Usado por el endpoint on-demand y el cron job.
	 */
	pullAndSync = async (): Promise<NominaSyncResult> => {
		const members = await this.pullNomina();
		return this.syncNomina(members);
	};
}
