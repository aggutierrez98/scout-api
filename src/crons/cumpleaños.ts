import { prismaClient } from "../utils/lib/prisma-client";
import { NotificacionService } from "../services/notificacion";
import logger from "../utils/classes/Logger";
import { nowArgentina } from "./helpers";

export async function ejecutarCumpleañosCron() {
	const hoyArg = nowArgentina();
	const mmdd = `${String(hoyArg.getUTCMonth() + 1).padStart(2, "0")}-${String(hoyArg.getUTCDate()).padStart(2, "0")}`;

	const [scoutsHoy, familiaresHoy] = await Promise.all([
		prismaClient.$queryRaw<{ uuid: string; nombre: string; apellido: string }[]>`
			SELECT uuid, nombre, apellido FROM Scout
			WHERE strftime('%m-%d', fechaNacimiento) = ${mmdd}
			AND estado = 'ACTIVO'
		`,
		prismaClient.$queryRaw<{ uuid: string; nombre: string; apellido: string }[]>`
			SELECT uuid, nombre, apellido FROM Familiar
			WHERE strftime('%m-%d', fechaNacimiento) = ${mmdd}
		`,
	]);

	if (scoutsHoy.length === 0 && familiaresHoy.length === 0) {
		logger.info("[Cron/Cumpleaños] Sin cumpleaños hoy");
		return;
	}

	const users = await prismaClient.user.findMany({
		where: { active: true },
		select: { uuid: true },
	});
	const userIds = users.map((u) => u.uuid);
	if (userIds.length === 0) return;

	const notificacionService = new NotificacionService();

	for (const scout of scoutsHoy) {
		await notificacionService.crearAviso({
			titulo: "¡Hoy hay cumpleaños!",
			mensaje: `Hoy es el cumpleaños de ${scout.nombre} ${scout.apellido}`,
			tipo: "CUMPLEAÑOS",
			referenciaId: scout.uuid,
			referenciaTipo: "scout",
			userIds,
		});
		logger.info(`[Cron/Cumpleaños] Aviso enviado para scout ${scout.nombre} ${scout.apellido}`);
	}

	for (const familiar of familiaresHoy) {
		await notificacionService.crearAviso({
			titulo: "¡Hoy hay cumpleaños!",
			mensaje: `Hoy es el cumpleaños de ${familiar.nombre} ${familiar.apellido}`,
			tipo: "CUMPLEAÑOS",
			referenciaId: familiar.uuid,
			referenciaTipo: "familiar",
			userIds,
		});
		logger.info(`[Cron/Cumpleaños] Aviso enviado para familiar ${familiar.nombre} ${familiar.apellido}`);
	}
}
