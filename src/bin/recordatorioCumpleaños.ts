import cron from 'node-cron';
import { WhatsAppSbot } from '../whatsapp/WhatsappSession';
import { obtenerCumpleañosHoy } from '../whatsapp/useCases';

export default async function rememberBirthdays() {
    function logMessage() {
        console.log('Cronjob realizado! - Fecha y Hora:', new Date().toLocaleString());
    }

    cron.schedule('0 8 * * *', async () => {
        const wb = WhatsAppSbot.getInstance()
        const resp = await obtenerCumpleañosHoy()
        if (resp) await wb.sendMessageToGroup(resp)
        logMessage()
    });
}