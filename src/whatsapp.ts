import qrCode from "qrcode-terminal";
import { Client, LocalAuth } from "whatsapp-web.js";

//TODO: Crear todas las utilidades del bot de whatsapp

async function whatsappClientConnection() {
	try {
		const client = new Client({
			authStrategy: new LocalAuth({
				clientId: "sbot",
			}),
			puppeteer: {
				args: [
					"--no-sandbox",
					"--disable-dev-shm-usage",
					"--disable-gpu",
					"--disable-databases",
					"--disable-extensions",
					"--disable-client-side-phishing-detection",
					"--disable-component-extensions-with-background-pages",
					"--disable-default-apps",
					"--hide-scrollbars",
					"--no-default-browser-check",
					"--no-first-run",
					"--disable-features=Translate,MediaRouter",
					"--single-process",
					"--window-size=10,10",
				],
			},
		});

		client.on("qr", (qr) => {
			qrCode.generate(qr, { small: true });
		});

		client.on("auth_failure", () => {
			throw new Error("Error al iniciar sesion")
		})

		client.on("ready", () => {
			console.log("Cliente de Whatsapp listo");
		});

		client.on("message", async (message) => {
			const chat = await message.getChat();
			if (chat.isGroup) {
				if (chat.id._serialized === process.env.WHATSAPP_US_CHAT_ID) {
					if (message.body === "!sb") {
						client.sendMessage(message.from, "Soy sbot para vos y tu vieja");
					}
				}
			}
		});

		client.on("message_create", async (message) => {
			const chat = await message.getChat();
			if (chat.isGroup) {
				if (chat.id._serialized === process.env.WHATSAPP_US_CHAT_ID) {
					if (message.body === "!sb") {
						client.sendMessage(message.from, "Soy sbot para vos y tu vieja");
					}
				}
			}
		});

		client.initialize();

	} catch (error) {
		console.log(error);
	}
}

export default whatsappClientConnection;
