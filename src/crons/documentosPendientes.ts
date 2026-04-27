import { DocumentoService } from "../services/documento";
import { NotificacionService } from "../services/notificacion";
import logger from "../utils/classes/Logger";
import { prismaClient } from "../utils/lib/prisma-client";
import { endOfDayArg, nowArgentina, startOfDayArg } from "./helpers";

type DocumentoPendienteItem = Awaited<
	ReturnType<DocumentoService["getDocumentosPendientes"]>
>[number];

const buildMensajePendientes = (items: DocumentoPendienteItem[]) => {
	const total = items.length;
	const totalScouts = new Set(items.map((item) => item.scoutId)).size;
	const totalVencidos = items.filter(
		(item) => item.estado === "VENCIDO_ANUAL",
	).length;
	const totalFaltantes = total - totalVencidos;

	return `Tenés ${total} documento(s) pendiente(s) de ${totalScouts} scout(s): ${totalFaltantes} faltante(s) y ${totalVencidos} vencido(s). Revisá la sección Documentos pendientes.`;
};

const dedupePendientes = (items: DocumentoPendienteItem[]) => {
	const unique = new Map<string, DocumentoPendienteItem>();
	for (const item of items) {
		unique.set(`${item.scoutId}::${item.documentoId}`, item);
	}
	return Array.from(unique.values());
};

export async function ejecutarDocumentosPendientesCron() {
	const documentoService = new DocumentoService();
	const pendientes = await documentoService.getDocumentosPendientes({
		scopingContext: { scope: "ALL" },
	});

	if (pendientes.length === 0) {
		logger.info("[Cron/Documentos] Sin pendientes para notificar");
		return;
	}

	const pendientesPorScout = new Map<string, DocumentoPendienteItem[]>();
	for (const pendiente of pendientes) {
		const existing = pendientesPorScout.get(pendiente.scoutId) ?? [];
		existing.push(pendiente);
		pendientesPorScout.set(pendiente.scoutId, existing);
	}

	const relaciones = await prismaClient.familiarScout.findMany({
		where: {
			scoutId: { in: Array.from(pendientesPorScout.keys()) },
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
	});

	const pendientesPorUsuario = new Map<string, DocumentoPendienteItem[]>();
	for (const relacion of relaciones) {
		const userId = relacion.familiar.user?.uuid;
		const userActive = relacion.familiar.user?.active;
		if (!userId || !userActive) continue;

		const pendientesScout = pendientesPorScout.get(relacion.scoutId) ?? [];
		if (!pendientesScout.length) continue;

		const existing = pendientesPorUsuario.get(userId) ?? [];
		existing.push(...pendientesScout);
		pendientesPorUsuario.set(userId, existing);
	}

	if (pendientesPorUsuario.size === 0) {
		logger.info("[Cron/Documentos] No hay usuarios familiares activos para notificar");
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
				aviso: { tipo: "DOCUMENTO_PENDIENTE" },
			},
		});
		if (yaEnviado) continue;

		const pendientesDedupe = dedupePendientes(pendientesUsuario);
		await notificacionService.crearAviso({
			titulo: "Documentos pendientes",
			mensaje: buildMensajePendientes(pendientesDedupe),
			tipo: "DOCUMENTO_PENDIENTE",
			userIds: [userId],
		});
		enviadas++;
	}

	logger.info(`[Cron/Documentos] ${enviadas} aviso(s) de documentos pendientes enviados`);
}
