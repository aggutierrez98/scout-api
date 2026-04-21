// Argentina is UTC-3, no DST
const ARG_OFFSET_MS = -3 * 60 * 60 * 1000;

/** Devuelve un Date representando la fecha/hora actual en Argentina (sus componentes UTC son la hora Argentina). */
export function nowArgentina(): Date {
	const now = new Date();
	return new Date(now.getTime() + ARG_OFFSET_MS);
}

/** Devuelve el inicio del día (00:00:00 Argentina) expresado en UTC. */
export function startOfDayArg(argDate: Date): Date {
	return new Date(Date.UTC(argDate.getUTCFullYear(), argDate.getUTCMonth(), argDate.getUTCDate(), 3, 0, 0));
}

/** Devuelve el fin del día (23:59:59.999 Argentina) expresado en UTC. */
export function endOfDayArg(argDate: Date): Date {
	return new Date(Date.UTC(argDate.getUTCFullYear(), argDate.getUTCMonth(), argDate.getUTCDate() + 1, 2, 59, 59, 999));
}

/** Devuelve un Date que representa argDate + N días (en timezone Argentina). */
export function addDaysArg(argDate: Date, days: number): Date {
	const result = new Date(argDate);
	result.setUTCDate(result.getUTCDate() + days);
	return result;
}

export const MESES_ES = [
	"ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
	"JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
] as const;
