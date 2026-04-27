import { NotificacionService } from "../services/notificacion";
import { ServicioPagosPendientes } from "../services/servicioPagosPendientes";
import logger from "../utils/classes/Logger";
import { prismaClient } from "../utils/lib/prisma-client";
import { nowArgentina, startOfDayArg, endOfDayArg } from "./helpers";

type PendienteItem = {
	id: string;
	tipo: string;
	periodo: string;
	estado: string;
	scout: {
		id: string;
		nombre: string;
		apellido: string;
		rama?: string | null;
	} | null;
	montoPendiente: number;
};

const buildMensajePendientes = (pendientes: PendienteItem[]) => {
	const total = pendientes.length;
	const totalMonto = pendientes.reduce((acc, item) => acc + Math.max(item.montoPendiente, 0), 0);
	const scouts = Array.from(
		new Set(
			pendientes
				.map((item) => item.scout)
				.filter(Boolean)
				.map((scout: any) => `${scout.nombre} ${scout.apellido}`),
		),
	);
	const resumenScouts = scouts.slice(0, 3).join(", ");
	const mas = scouts.length > 3 ? ` y ${scouts.length - 3} más` : "";
	return `Tenés ${total} obligación(es) de pago pendiente(s) por $${Math.round(totalMonto)}. Scouts: ${resumenScouts}${mas}.`;
};

export async function ejecutarCuotaMensualCron() {
	const servicioPagosPendientes = new ServicioPagosPendientes();
	const pendientes = (await servicioPagosPendientes.listarPendientesNotificables()) as PendienteItem[];

	if (pendientes.length === 0) {
		logger.info("[Cron/Cuota] Sin pendientes para notificar");
		return;
	}

	const scoutIds = Array.from(
		new Set(pendientes.map((item) => item.scout?.id).filter(Boolean) as string[]),
	);

	if (scoutIds.length === 0) {
		logger.info("[Cron/Cuota] No hay scouts asociados a las obligaciones pendientes");
		return;
	}

	const [usuariosDirectos, relacionesFamiliares] = await Promise.all([
		prismaClient.user.findMany({
			where: {
				scoutId: { in: scoutIds },
				active: true,
			},
			select: {
				uuid: true,
				scoutId: true,
			},
		}),
		prismaClient.familiarScout.findMany({
			where: {
				scoutId: { in: scoutIds },
			},
			select: {
				scoutId: true,
				familiar: {
					select: {
						user: {
							select: {
								uuid: true,
								active: true,
							},
						},
					},
				},
			},
		}),
	]);

	const pendientesPorScout = new Map<string, PendienteItem[]>();
	for (const item of pendientes) {
		if (!item.scout?.id) continue;
		const existentes = pendientesPorScout.get(item.scout.id) ?? [];
		existentes.push(item);
		pendientesPorScout.set(item.scout.id, existentes);
	}

	const pendientesPorUsuario = new Map<string, PendienteItem[]>();
	const agregarPendientesUsuario = (userId: string, scoutId: string) => {
		const pendientesScout = pendientesPorScout.get(scoutId) ?? [];
		if (pendientesScout.length === 0) return;
		const existentes = pendientesPorUsuario.get(userId) ?? [];
		existentes.push(...pendientesScout);
		pendientesPorUsuario.set(userId, existentes);
	};

	for (const user of usuariosDirectos) {
		if (!user.scoutId) continue;
		agregarPendientesUsuario(user.uuid, user.scoutId);
	}

	for (const relacion of relacionesFamiliares) {
		const userId = relacion.familiar.user?.uuid;
		if (!userId || !relacion.familiar.user?.active) continue;
		agregarPendientesUsuario(userId, relacion.scoutId);
	}

	if (pendientesPorUsuario.size === 0) {
		logger.info("[Cron/Cuota] No hay usuarios destinatarios para notificar");
		return;
	}

	const nowArg = nowArgentina();
	const hoyInicio = startOfDayArg(nowArg);
	const hoyFin = endOfDayArg(nowArg);
	const notificacionService = new NotificacionService();
	let enviadas = 0;

	for (const [userId, pendientesUsuario] of pendientesPorUsuario.entries()) {
		const yaEnviado = await prismaClient.notificacion.findFirst({
			where: {
				userId,
				fechaCreacion: { gte: hoyInicio, lte: hoyFin },
				aviso: { tipo: "PAGO_PENDIENTE" },
			},
		});
		if (yaEnviado) continue;

		const dedupe = new Map<string, PendienteItem>();
		for (const item of pendientesUsuario) {
			dedupe.set(item.id, item);
		}
		const pendientesDedupe = Array.from(dedupe.values());

		await notificacionService.crearAviso({
			titulo: "Pagos pendientes",
			mensaje: buildMensajePendientes(pendientesDedupe),
			tipo: "PAGO_PENDIENTE",
			userIds: [userId],
		});
		enviadas += 1;
	}

	logger.info(`[Cron/Cuota] ${enviadas} aviso(s) enviados`);
}
