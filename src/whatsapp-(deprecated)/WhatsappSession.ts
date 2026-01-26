import { Client, Message } from "whatsapp-web.js";
import qrCode from "qrcode-terminal";
import {
    obtenerCumpleañosPrevios,
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
import { MongoStore } from "wwebjs-mongo";
import mongoose from 'mongoose';
import getConfig from "./clientConfig";
import logger from "../utils/classes/Logger";

export class WhatsAppSbot {
    private static instance: WhatsAppSbot;
    private client: Client | null = null;

    private constructor() {
        this.connectMongo().then((store) => {
            this.client = new Client(getConfig(store));
            this.initialize();
        })
    }

    public async connectMongo() {
        await mongoose.connect(process.env.MONGODB_URI!)
        return new MongoStore({ mongoose: mongoose });
    }

    public initialize() {
        this.client!.on('qr', (qr: string) => {
            qrCode.generate(qr, { small: true });
        });

        this.client!.on('auth_failure', (msg) => {
            logger.error(`Error de autenticacion: ${msg}`)
        });

        this.client!.on('ready', () => {
            logger.info("Cliente de Whatsapp SB listo")
        });

        this.client!.on('remote_session_saved', () => {
            logger.info("Session guardada en mongo")
        });

        this.client!.on('message', async (msg) => {
            const chat = await msg.getChat();
            if (chat.id._serialized === process.env.WHATSAPP_US_CHAT_ID) await this.ManageMessage(msg)
        });

        this.client!.on('message_create', async (msg) => {
            const chat = await msg.getChat();
            if (chat.id._serialized === process.env.WHATSAPP_US_CHAT_ID) await this.ManageMessage(msg)
        });

        this.client!.initialize();
    }

    public async sendMessage(message: string, phoneNumber: string) {
        const chatId = phoneNumber.substring(1) + "@c.us";
        await this.client!.sendMessage(chatId, message);
    }

    public async sendMessageToGroup(message: string, groupId?: string) {
        await this.client!.sendMessage(groupId ?? process.env.WHATSAPP_US_CHAT_ID!, message);
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

                            case "equipo":
                                const equipo = commandSubOption[1]
                                if (!equipo) await msg.reply("Enviar (nombre.apellido) del scout")
                                else {
                                    const scoutsInfo = await obtenerScouts("", equipo)
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

                            case "equipo":
                                const equipo = commandSubOption[1]
                                if (!equipo) await msg.reply("Enviar (nombre) de la equipo")
                                else {
                                    const equipoEntregas = await obtenerEntregas("", equipo)
                                    await msg.reply(equipoEntregas)
                                }
                                break;

                            default:
                                await msg.reply("Opcion invalida")
                                break;
                        }
                        break

                    case "cumpleaños":
                        const dias = commandSubOption[1]
                        switch (subCommand) {
                            case "previos":
                                if (!dias) await msg.reply("Enviar dias para buscar")
                                else {
                                    const scoutsQueCumplieron = await obtenerCumpleañosPrevios(Number(dias))
                                    await msg.reply(scoutsQueCumplieron)
                                }
                                break;

                            case "proximos":
                                if (!dias) await msg.reply("Enviar dias para buscar")
                                else {
                                    const scoutsPorCumplir = await obtenerScoutsPorCumplirAños(Number(dias))
                                    await msg.reply(scoutsPorCumplir)
                                }
                                break;

                            default:
                                await msg.reply("Opcion invalida")
                                break;
                        }
                        break

                    default:
                        await msg.reply("Opcion invalida")
                        break;
                }
            }
        }
    }

    private GetMenu(section: string, options: string[]): string {
        const formattedOptions = options.map((option) => `- ${option}`).join('\n')
        const isMain = section === "menu"
        const sectionString = isMain ? "" : ` ${section}`
        return `${isMain ? "_MENU PRINCIPAL" : "_Menu de opciones"}${sectionString}_ (Todas comienzan con *#sb${sectionString}*):\n${formattedOptions}`;
    }
}