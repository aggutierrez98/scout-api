import { Client, Message } from "whatsapp-web.js";
import qrCode from "qrcode-terminal";
import clientConfig from "./clientConfig";
import {
    obtenerDocumentosFaltantes,
    obtenerDocumentosScout,
    obtenerEntregas,
    obtenerFamiliar,
    obtenerFamiliaresScout,
    obtenerPagosScout,
    obtenerPagosSemana,
    obtenerScouts,
    obtenerScoutsPorCumplirAños
} from "./useCases";
import options from "./options";
import { MENU_COMMANDS } from "../utils";

export class WhatsAppSbot {
    private static instance: WhatsAppSbot;
    private client: Client;

    private constructor() {
        this.client = new Client(clientConfig);
        this.initialize();
    }

    private initialize() {
        this.client.on('qr', (qr: string) => {
            qrCode.generate(qr, { small: true });
        });

        // //   this.client.on('authenticated', (session) => {
        // //     console.log('Authenticated');
        // //   });

        this.client.on('auth_failure', (msg) => {
            console.error('Error de autenticacion:', msg);
        });

        this.client.on('ready', () => {
            console.log("Cliente de Whatsapp SB listo");
        });

        this.client.on('message', async (msg) => {
            const chat = await msg.getChat();
            if (chat.id._serialized === process.env.WHATSAPP_US_CHAT_ID) await this.ManageMessage(msg)
        });

        this.client.on('message_create', async (msg) => {
            const chat = await msg.getChat();
            if (chat.id._serialized === process.env.WHATSAPP_US_CHAT_ID) await this.ManageMessage(msg)
        });

        this.client.initialize();
    }

    public async sendMessage(message: string, phoneNumber: string) {
        const chatId = phoneNumber.substring(1) + "@c.us";
        await this.client.sendMessage(chatId, message);
    }

    public async sendMessageToGroup(message: string, groupId?: string) {
        await this.client.sendMessage(groupId ?? process.env.WHATSAPP_US_CHAT_ID!, message);
    }

    public static getInstance(): WhatsAppSbot {
        if (!WhatsAppSbot.instance) {
            WhatsAppSbot.instance = new WhatsAppSbot();
        }
        return WhatsAppSbot.instance;
    }


    public async ManageMessage(msg: Message) {

        if (msg.body === "#sb" || msg.body.startsWith('#sb ')) {
            const [command, ...commandSubOption] = msg.body.split("#sb")[1].split(" ").slice(1)
            const subCommand = commandSubOption[0];

            if (!command) await msg.reply("Soy _SBot_ para lo que necesites pa.\nSi necesitas ayuda escribi *#sb menu*");
            else {
                // @ts-ignore
                if (!subCommand && MENU_COMMANDS.includes(command)) return await msg.reply(this.GetMenu((command), options[command]));

                switch (command) {
                    case "menu":
                        await msg.reply(this.GetMenu(command, options[command]));
                        break;

                    case "scouts":
                        switch (subCommand) {
                            case "total":
                                const scoutsInfo = await obtenerScouts()
                                await msg.reply(scoutsInfo);
                                break;

                            case "patrulla":
                                const patrulla = commandSubOption[1]
                                if (!patrulla) await msg.reply("Enviar (nombre.apellido) del scout")
                                else {
                                    const scoutsInfo = await obtenerScouts("", patrulla)
                                    await msg.reply(scoutsInfo)
                                }
                                break;

                            case "scout":
                                const scout = commandSubOption[1]
                                if (!scout) await msg.reply("Enviar scout")
                                else {
                                    const scoutInfo = await obtenerScouts(scout)
                                    await msg.reply(scoutInfo)
                                }
                                break;

                            default:
                                await msg.reply("Opcion invalida")
                                break;
                        }
                        break

                    case "pagos":
                        switch (subCommand) {
                            case "semana":
                                const pagosSemana = await obtenerPagosSemana()
                                await msg.reply(pagosSemana);
                                break;

                            case "scout":
                                const nombreScout = commandSubOption[1]
                                if (!nombreScout) await msg.reply("Enviar (nombre.apellido) del scout")
                                else {
                                    const concepto = commandSubOption[2]
                                    const cuotasScout = await obtenerPagosScout(nombreScout, concepto)
                                    await msg.reply(cuotasScout)
                                }
                                break;

                            case "concepto":
                                const concepto = commandSubOption[1]
                                if (!concepto) await msg.reply("Enviar concepto")
                                else {
                                    const concepto = commandSubOption[2]
                                    const cuotasScout = await obtenerPagosScout("", concepto)
                                    await msg.reply(cuotasScout)
                                }
                                break;

                            default:
                                await msg.reply("Opcion invalida")
                                break;

                        }
                        break

                    case "documentos":
                        const nombreScout = commandSubOption[1]
                        switch (subCommand) {
                            case "entregados":
                                if (!nombreScout) await msg.reply("Enviar (nombre.apellido) del scout")
                                else {
                                    const docsScout = await obtenerDocumentosScout(nombreScout)
                                    await msg.reply(docsScout)
                                }
                                break;

                            case "faltantes":
                                if (!nombreScout) await msg.reply("Enviar (nombre.apellido) del scout")
                                else {
                                    const docsFaltantesScout = await obtenerDocumentosFaltantes(nombreScout)
                                    await msg.reply(docsFaltantesScout)
                                }
                                break;

                            default:
                                await msg.reply("Opcion invalida")
                                break;
                        }
                        break

                    case "familiares":
                        switch (subCommand) {
                            case "scout":
                                const nombreScout = commandSubOption[1]
                                if (!nombreScout) await msg.reply("Enviar (nombre.apellido) del scout")
                                else {
                                    const familiaScout = await obtenerFamiliaresScout(nombreScout)
                                    await msg.reply(familiaScout)
                                }
                                break;

                            default:
                                const nombreFamiliar = subCommand;
                                const familiar = await obtenerFamiliar(nombreFamiliar)
                                await msg.reply(familiar)
                                break;
                        }
                        break

                    case "entregas":
                        switch (subCommand) {
                            case "scout":
                                const scout = commandSubOption[1]
                                if (!scout) await msg.reply("Enviar (nombre.apellido) del scout")
                                else {
                                    const scoutEntregas = await obtenerEntregas(scout)
                                    await msg.reply(scoutEntregas)
                                }
                                break;

                            case "patrulla":
                                const patrulla = commandSubOption[1]
                                if (!patrulla) await msg.reply("Enviar (nombre) de la patrulla")
                                else {
                                    const patrullaEntregas = await obtenerEntregas("", patrulla)
                                    await msg.reply(patrullaEntregas)
                                }
                                break;

                            default:
                                await msg.reply("Opcion invalida")
                                break;
                        }
                        break

                    case "cumpleaños":
                        const listaScouts = await obtenerScoutsPorCumplirAños()
                        await msg.reply(listaScouts)
                        break;

                    default:
                        await msg.reply("Opcion invalida")
                        break;
                }
            }
        }
    }

    private GetMenu(section: string, options: string[]): string {
        const formattedOptions = options.map((option, index) => `${index + 1}. ${option}`).join('\n')
        const isMain = section === "menu"
        return `${isMain ? "_MENU PRINCIPAL_" : "Menu de opciones"} ${section} (Todas comienzan con *#sb${!isMain ? ` ${section}` : ""}*):\n${formattedOptions}`;
    }
}