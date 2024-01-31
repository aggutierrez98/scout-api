import { Client, Message } from "whatsapp-web.js";
import qrCode from "qrcode-terminal";
import clientConfig from "./clientConfig";
import { obtenerPagosScout, obtenerPagosSemana, obtenerScouts, obtenerScoutsPorCumplirAños } from "./useCases";

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

            if (!command) await msg.reply("Soy _SBot_ para lo que necesites pa.\nSi necesitas ayuda escribi *#sb menu*");

            else {
                const subCommand = commandSubOption[0];

                switch (command) {
                    case "menu":
                        await msg.reply(this.MenuPrincipal());
                        break;

                    case "cumpleaños":
                        const listaScouts = await obtenerScoutsPorCumplirAños()
                        await msg.reply(listaScouts)
                        break;

                    case "scouts":
                        if (!subCommand) await msg.reply(this.MenuScouts());
                        else {
                            switch (subCommand) {
                                case "total":
                                    const scoutsInfo = await obtenerScouts()
                                    await msg.reply(scoutsInfo);
                                    break;

                                case "patrulla":
                                    const patrulla = commandSubOption[1]
                                    if (!patrulla) await msg.reply("Enviar nombre/apellido del scout")
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
                        }
                        break;

                    case "pagos":
                        if (!subCommand) await msg.reply(this.MenuPagos());
                        else {
                            switch (subCommand) {
                                case "semana":
                                    const pagosSemana = await obtenerPagosSemana()
                                    await msg.reply(pagosSemana);
                                    break;

                                case "scout":
                                    const nombreScout = commandSubOption[1]
                                    if (!nombreScout) await msg.reply("Enviar nombre/apellido del scout")
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
                        }
                        break;

                    case "documentos":
                        //TODO Hacer las siguientes usecases
                        // Documentos entregados por scout
                        // Documentos faltantes para este año por scout
                        // Total de documentos faltantes
                        // Documentos entregados la ultima semana
                        await msg.reply("documentos ponele...")
                        break;

                    case "familiares":
                        //TODO Hacer las siguientes usecases
                        // Familiares del scout
                        // Informacion del famiiar por nombre
                        await msg.reply("familiares ponele...")
                        break;

                    case "entregas":
                        //TODO Hacer las siguientes usecases
                        // Entregas realizadas para un scout
                        // Entregas realizadas por patrulla
                        await msg.reply("entregas ponele...")
                        break;

                    default:
                        await msg.reply("Opcion invalida")
                        break;
                }
            }
        }
    }

    private MenuPrincipal(): string {
        const options = [
            "scouts: Consultar Scouts",
            "pagos: Consultar Pagos",
            "cumpleaños: Fechas de cumpleaños proximas",
            "scouts:",
        ];
        const formattedOptions = options.map((option, index) => `${index + 1}. ${option}`).join('\n');
        return `Menu de opciones (Todas comienzan con *#sb*):\n${formattedOptions}`;
    }

    private MenuPagos(): string {
        const options = [
            "semana: Consultar Pagos ultima semana",
            "scout (nombre/apellido): Consultar Pagos de (xxx)",
            "scout concepto (nombre/apellido - concepto): Consultar Pagos de (xxx) con concepto (xxx)",
            "concepto (concepto): Consultar pagos segun concepto (xxx)",
        ];
        const formattedOptions = options.map((option, index) => `${index + 1}. ${option}`).join('\n');
        return `Menu de opciones pagos (Todas comienzan con *#sb pagos*):\n${formattedOptions}`;
    }

    private MenuScouts(): string {
        const options = [
            "total: Consultar numeros totales de scouts",
            "patrulla (nombre): Consultar scouts de patrulla (xxx)",
            "scout (nombre/apellido): Consultar Scout (xxx)",
        ];
        const formattedOptions = options.map((option, index) => `${index + 1}. ${option}`).join('\n');
        return `Menu de opciones scouts (Todas comienzan con *#sb scouts*):\n${formattedOptions}`;
    }
}