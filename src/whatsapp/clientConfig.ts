import { LocalAuth } from "whatsapp-web.js";

export default {
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
}