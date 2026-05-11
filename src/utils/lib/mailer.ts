import nodemailer from "nodemailer";
import { SecretsManager } from "../classes/SecretsManager";

const createTransporter = () => {
	const { USER, APP_PASSWORD } = SecretsManager.getInstance().getGmailSecrets();
	return nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: { user: USER, pass: APP_PASSWORD },
	});
};

export const sendMail = async ({
	to,
	subject,
	text,
}: {
	to: string | string[];
	subject: string;
	text: string;
}) => {
	const { USER } = SecretsManager.getInstance().getGmailSecrets();
	const transporter = createTransporter();
	await transporter.sendMail({ from: USER, to, subject, text });
};
