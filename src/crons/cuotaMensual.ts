import { prismaClient } from "../utils/lib/prisma-client";
import { NotificacionService } from "../services/notificacion";
import logger from "../utils/classes/Logger";
import { nowArgentina, startOfDayArg, endOfDayArg, MESES_ES } from "./helpers";

export async function ejecutarCuotaMensualCron() {
	const hoyArg = nowArgentina();
	const mes = MESES_ES[hoyArg.getUTCMonth()];
	const mesCapitalized = mes.charAt(0) + mes.slice(1).toLowerCase();
	const year = hoyArg.getUTCFullYear();

	// Concepto en uppercase (así se almacena en DB)
	const conceptoCuota = `CUOTA DE GRUPO DE ${mes}`;

	// Rango del mes actual en UTC (Argentina UTC-3 → 00:00 ART = 03:00 UTC)
	const inicioMes = new Date(Date.UTC(year, hoyArg.getUTCMonth(), 1, 3, 0, 0));
	const finMes = new Date(Date.UTC(year, hoyArg.getUTCMonth() + 1, 1, 3, 0, 0));

	// Rango de hoy en Argentina (para dedup anti-reinicio)
	const hoyInicio = startOfDayArg(hoyArg);
	const hoyFin = endOfDayArg(hoyArg);

	const familiares = await prismaClient.familiar.findMany({
		where: { user: { active: true } },
		select: {
			uuid: true,
			nombre: true,
			apellido: true,
			user: { select: { uuid: true } },
			padreScout: {
				select: {
					scout: {
						select: {
							pagosRealizados: {
								where: {
									concepto: { contains: conceptoCuota },
									fechaPago: { gte: inicioMes, lt: finMes },
								},
								select: { uuid: true },
								take: 1,
							},
						},
					},
				},
			},
		},
	});

	const notificacionService = new NotificacionService();
	let enviadas = 0;

	for (const familiar of familiares) {
		if (!familiar.user?.uuid) continue;

		// Si algún scout asociado ya pagó la cuota de este mes, se omite
		const yaPago = familiar.padreScout.some((fs) => fs.scout.pagosRealizados.length > 0);
		if (yaPago) continue;

		// Dedup: no enviar más de una vez el mismo día (por reinicios del proceso)
		const yaEnviado = await prismaClient.notificacion.findFirst({
			where: {
				userId: familiar.user.uuid,
				fechaCreacion: { gte: hoyInicio, lte: hoyFin },
				aviso: { tipo: "PAGO_PENDIENTE" },
			},
		});
		if (yaEnviado) continue;

		await notificacionService.crearAviso({
			titulo: "Cuota pendiente",
			mensaje: `Recordá abonar la cuota de grupo de ${mesCapitalized}. Concepto: "${conceptoCuota}"`,
			tipo: "PAGO_PENDIENTE",
			userIds: [familiar.user.uuid],
		});

		enviadas++;
		logger.info(`[Cron/Cuota] Aviso enviado a ${familiar.nombre} ${familiar.apellido}`);
	}

	logger.info(`[Cron/Cuota] ${enviadas} avisos de cuota pendiente enviados (${mes} ${year})`);
}
