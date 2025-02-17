import cron from 'node-cron';
import { WhatsAppSbot } from '../whatsapp/WhatsappSession';
import { obtenerCumpleañosHoy } from '../whatsapp/useCases';
import logger from '../utils/classes/Logger';

export default async function recordarCumpleaños() {
    function logMessage() {
        logger.info(`Cronjob realizado! - Fecha y Hora: ${new Date().toLocaleString()}`);
    }

    cron.schedule('0 8 * * *', async () => {
        const wb = WhatsAppSbot.getInstance()
        const resp = await obtenerCumpleañosHoy()
        if (resp) await wb.sendMessage(resp, process.env.WHATSAPP_OWNER_NUM!)
        logMessage()
    });
}