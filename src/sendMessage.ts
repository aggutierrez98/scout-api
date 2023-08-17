import qrCode from "qrcode-terminal";
import whatsapp from "whatsapp-web.js";
const { Client, LocalAuth } = whatsapp;

async function whatsappClientConnection(message: string) {
	try {
		const client = new Client({
			authStrategy: new LocalAuth({}),
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
				headless: true,
			},
		});

		client.on("qr", (qr) => {
			qrCode.generate(qr, { small: true });
		});

		client.on("ready", () => {
			console.log("Whatsapp client ready");
		});

		const messageSent = await client.sendMessage(
			process.env.WHATSAPP_US_CHAT_ID ?? "",
			message,
		);
		client.initialize();
	} catch (error) {
		console.log(error);
	}
}

export default whatsappClientConnection;
