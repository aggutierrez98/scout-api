import cron from "node-cron";
import logger from "../utils/classes/Logger";
import { ejecutarCumpleañosCron } from "./cumpleaños";
import { ejecutarEventosReminderCron } from "./eventosReminder";
import { ejecutarCuotaMensualCron } from "./cuotaMensual";
import { ejecutarDocumentosPendientesCron } from "./documentosPendientes";

const TZ = "America/Argentina/Buenos_Aires";

export function registerCrons() {
	// Cumpleaños: scouts y familiares — todos los días a las 9:00 AM Argentina
	cron.schedule(
		"0 9 * * *",
		async () => {
			logger.info("[Cron/Cumpleaños] Iniciando");
			try {
				await ejecutarCumpleañosCron();
			} catch (err) {
				logger.error(`[Cron/Cumpleaños] Error: ${(err as Error).message}`);
			}
		},
		{ timezone: TZ },
	);

	// Recordatorio de eventos — todos los días a las 9:00 AM Argentina
	// Cubre: día siguiente a la creación + 1, 3, 5, 7, 14 días antes del evento
	cron.schedule(
		"0 9 * * *",
		async () => {
			logger.info("[Cron/Eventos] Iniciando");
			try {
				await ejecutarEventosReminderCron();
			} catch (err) {
				logger.error(`[Cron/Eventos] Error: ${(err as Error).message}`);
			}
		},
		{ timezone: TZ },
	);

	// Pagos pendientes — todos los sábados a las 10:00 AM Argentina
	// Usa el motor de obligaciones/imputaciones y notifica familiares + usuario directo del scout
	cron.schedule(
		"0 10 * * 6",
		async () => {
			logger.info("[Cron/Cuota] Iniciando");
			try {
				await ejecutarCuotaMensualCron();
			} catch (err) {
				logger.error(`[Cron/Cuota] Error: ${(err as Error).message}`);
			}
		},
		{ timezone: TZ },
	);

	// Documentos pendientes/vencidos — todos los sábados a las 10:00 AM Argentina
	// Recuerda a familiares con usuarios asociados sobre documentos requeridos para ingreso.
	cron.schedule(
		"0 10 * * 6",
		async () => {
			logger.info("[Cron/Documentos] Iniciando");
			try {
				await ejecutarDocumentosPendientesCron();
			} catch (err) {
				logger.error(`[Cron/Documentos] Error: ${(err as Error).message}`);
			}
		},
		{ timezone: TZ },
	);

	logger.info("[Crons] Crons de notificaciones registrados");
}
