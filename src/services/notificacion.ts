import { nanoid } from "nanoid";
import { IAviso } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapAviso, mapNotificacion } from "../mappers/notificacion";

type queryParams = {
	limit?: number;
	offset?: number;
	filters?: {
		leida?: string;
	};
};

interface INotificacionService {
	crearAviso: (data: IAviso) => Promise<ReturnType<typeof mapAviso>>;
	getNotificaciones: (userId: string, params: queryParams) => Promise<{ notificaciones: ReturnType<typeof mapNotificacion>[]; totalNoLeidas: number }>;
	marcarLeida: (notificacionUuid: string, userId: string) => Promise<ReturnType<typeof mapNotificacion>>;
	marcarTodasLeidas: (userId: string) => Promise<{ actualizadas: number }>;
	contarNoLeidas: (userId: string) => Promise<number>;
}

export class NotificacionService implements INotificacionService {
	crearAviso = async (data: IAviso) => {
		const { userIds, ...avisoData } = data;
		const avisoUuid = nanoid(10);

		const result = await prismaClient.$transaction(async (tx) => {
			const aviso = await tx.aviso.create({
				data: {
					...avisoData,
					uuid: avisoUuid,
				},
			});

			await tx.notificacion.createMany({
				data: userIds.map((userId) => ({
					uuid: nanoid(10),
					avisoId: avisoUuid,
					userId,
				})),
			});

			return aviso;
		});

		return mapAviso(result);
	};

	getNotificaciones = async (userId: string, { limit = 20, offset = 0, filters = {} }: queryParams) => {
		const { leida } = filters;

		const [notificaciones, totalNoLeidas] = await Promise.all([
			prismaClient.notificacion.findMany({
				where: {
					userId,
					leida: leida !== undefined ? leida === "true" : undefined,
				},
				include: {
					aviso: true,
				},
				orderBy: { fechaCreacion: "desc" },
				skip: offset,
				take: limit,
			}),
			prismaClient.notificacion.count({
				where: {
					userId,
					leida: false,
				},
			}),
		]);

		return {
			notificaciones: notificaciones.map((n) => mapNotificacion(n)),
			totalNoLeidas,
		};
	};

	marcarLeida = async (notificacionUuid: string, userId: string) => {
		const notificacion = await prismaClient.notificacion.update({
			where: {
				uuid: notificacionUuid,
				userId,
			},
			data: {
				leida: true,
				fechaLectura: new Date(),
			},
			include: {
				aviso: true,
			},
		});

		return mapNotificacion(notificacion);
	};

	marcarTodasLeidas = async (userId: string) => {
		const result = await prismaClient.notificacion.updateMany({
			where: {
				userId,
				leida: false,
			},
			data: {
				leida: true,
				fechaLectura: new Date(),
			},
		});

		return { actualizadas: result.count };
	};

	contarNoLeidas = async (userId: string) => {
		return prismaClient.notificacion.count({
			where: {
				userId,
				leida: false,
			},
		});
	};
}
