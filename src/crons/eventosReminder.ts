import { prismaClient } from "../utils/lib/prisma-client";
import { NotificacionService } from "../services/notificacion";
import logger from "../utils/classes/Logger";
import { nowArgentina, addDaysArg, startOfDayArg, endOfDayArg } from "./helpers";

const DIAS_RECORDATORIO = [1, 3, 5, 7, 14] as const;

async function resolverUserIdsDeParticipantes(eventoId: string): Promise<string[]> {
	const participantes = await prismaClient.eventoParticipante.findMany({
		where: { eventoId },
		select: { scoutId: true, tipoParticipante: true },
	});

	const jovenesIds = participantes
		.filter((p) => p.tipoParticipante === "JOVEN_PROTAGONISTA")
		.map((p) => p.scoutId);
	const educadoresIds = participantes
		.filter((p) => p.tipoParticipante === "EDUCADOR")
		.map((p) => p.scoutId);

	const userIds: string[] = [];

	if (jovenesIds.length > 0) {
		const familiares = await prismaClient.familiarScout.findMany({
			where: { scoutId: { in: jovenesIds } },
			include: { familiar: { include: { user: { select: { uuid: true } } } } },
		});
		for (const fs of familiares) {
			if (fs.familiar.user?.uuid) userIds.push(fs.familiar.user.uuid);
		}
	}

	if (educadoresIds.length > 0) {
		const users = await prismaClient.user.findMany({
			where: { scoutId: { in: educadoresIds } },
			select: { uuid: true },
		});
		for (const u of users) userIds.push(u.uuid);
	}

	return [...new Set(userIds)];
}

export async function ejecutarEventosReminderCron() {
	const notificacionService = new NotificacionService();
	const hoyArg = nowArgentina();

	// 1. Eventos creados ayer → primer recordatorio al día siguiente de la creación
	const ayerArg = addDaysArg(hoyArg, -1);
	const eventosCreados = await prismaClient.evento.findMany({
		where: {
			activo: true,
			fechaCreacion: {
				gte: startOfDayArg(ayerArg),
				lte: endOfDayArg(ayerArg),
			},
		},
		select: { uuid: true, nombre: true },
	});

	for (const evento of eventosCreados) {
		const userIds = await resolverUserIdsDeParticipantes(evento.uuid);
		if (userIds.length === 0) continue;

		await notificacionService.crearAviso({
			titulo: "Estás en un nuevo evento",
			mensaje: `Recordatorio: estás anotado en el evento "${evento.nombre}"`,
			tipo: "EVENTO",
			referenciaId: evento.uuid,
			referenciaTipo: "evento",
			userIds,
		});
		logger.info(`[Cron/Eventos] Recordatorio día-siguiente para evento "${evento.nombre}"`);
	}

	// 2. Recordatorios N días antes del evento
	for (const dias of DIAS_RECORDATORIO) {
		const targetArg = addDaysArg(hoyArg, dias);
		const eventos = await prismaClient.evento.findMany({
			where: {
				activo: true,
				fechaHoraInicio: {
					gte: startOfDayArg(targetArg),
					lte: endOfDayArg(targetArg),
				},
			},
			select: { uuid: true, nombre: true },
		});

		for (const evento of eventos) {
			const userIds = await resolverUserIdsDeParticipantes(evento.uuid);
			if (userIds.length === 0) continue;

			const diasTexto = dias === 1 ? "mañana" : `en ${dias} días`;
			await notificacionService.crearAviso({
				titulo: "Recordatorio de evento",
				mensaje: `El evento "${evento.nombre}" es ${diasTexto}. ¡No te olvides!`,
				tipo: "EVENTO",
				referenciaId: evento.uuid,
				referenciaTipo: "evento",
				userIds,
			});
			logger.info(`[Cron/Eventos] Recordatorio ${dias}d antes para evento "${evento.nombre}"`);
		}
	}
}
