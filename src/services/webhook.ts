import { nanoid } from "nanoid";
import { IWebhookComprobanteDatos, IWebhookResult } from "../types/webhook";
import { prismaClient } from "../utils/lib/prisma-client";
import { AppError, HttpCode } from "../utils";

export class WebhookService {
	procesarComprobante = async (datos: IWebhookComprobanteDatos): Promise<IWebhookResult> => {
		if (datos.monto === null) {
			throw new AppError({
				name: "MONTO_REQUERIDO",
				description: "El monto del comprobante no puede ser nulo",
				httpCode: HttpCode.UNPROCESSABLE_ENTITY,
			});
		}

		// 1. Buscar scout por teléfono
		// Normalización: quitamos código de país Argentina (54) y ceros iniciales,
		// quedándonos con los últimos 10 dígitos para comparar.
		const normalizePhone = (phone: string) => {
			const digits = phone.replace(/\D/g, "");
			if (digits.startsWith("54")) return digits.slice(2);
			if (digits.startsWith("0")) return digits.slice(1);
			return digits.slice(-10);
		};

		const remitenteSuffix = normalizePhone(datos.whatsapp_remitente);

		const todosLosScouts = await prismaClient.scout.findMany({
			where: { telefono: { not: null } },
			select: { uuid: true, nombre: true, apellido: true, telefono: true },
		});

		let scout = todosLosScouts.find((s) => {
			return normalizePhone(s.telefono!) === remitenteSuffix;
		}) ?? null;

		// 2. Si no encontró por teléfono, buscar por nombre_emisor
		if (!scout && datos.nombre_emisor) {
			const palabras = datos.nombre_emisor.trim().split(/\s+/);

			for (const palabra of palabras) {
				const encontrado = await prismaClient.scout.findFirst({
					where: {
						OR: [
							{ nombre: { contains: palabra } },
							{ apellido: { contains: palabra } },
						],
					},
					select: { uuid: true, nombre: true, apellido: true, telefono: true },
				});

				if (encontrado) {
					scout = encontrado;
					break;
				}
			}
		}

		// 3. Si no encontró scout → error
		if (!scout) {
			throw new AppError({
				name: "SCOUT_NO_ENCONTRADO",
				description: `No se encontró un scout para el remitente ${datos.whatsapp_remitente} o nombre ${datos.nombre_emisor ?? "desconocido"}`,
				httpCode: HttpCode.UNPROCESSABLE_ENTITY,
			});
		}

		// 4. Construir el concepto
		const conceptoBase = datos.concepto ?? `TRANSFERENCIA ${datos.banco_emisor ?? "DESCONOCIDO"}`;
		const concepto = conceptoBase.toUpperCase().slice(0, 50);

		// 5. Crear el pago
		const pago = await prismaClient.pago.create({
			data: {
				uuid: nanoid(10),
				scoutId: scout.uuid,
				concepto,
				monto: datos.monto,
				metodoPago: "TRANSFERENCIA",
				fechaPago: datos.fecha ? new Date(datos.fecha) : new Date(),
				rendido: false,
			},
		});

		// 6. Retornar resultado
		return {
			pagoId: pago.uuid,
			scoutId: scout.uuid,
			monto: pago.monto,
			concepto: pago.concepto,
			fechaPago: pago.fechaPago.toISOString(),
		};
	};
}
