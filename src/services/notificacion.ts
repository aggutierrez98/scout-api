import { nanoid } from "nanoid";
import { IAviso } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapAviso, mapNotificacion } from "../mappers/notificacion";
import { PushNotificationService } from "./pushNotification";
import { PushTokenService } from "./pushToken";

type queryParams = {
	limit?: number;
	offset?: number;
	filters?: {
		leida?: string;
	};
};

type avisoQueryParams = {
	limit?: number;
	offset?: number;
	filters?: {
		tipo?: string;
		fechaDesde?: string;
		fechaHasta?: string;
		userId?: string;
	};
};

interface INotificacionService {
	crearAviso: (data: IAviso) => Promise<ReturnType<typeof mapAviso>>;
	getNotificaciones: (userId: string, params: queryParams) => Promise<{ notificaciones: ReturnType<typeof mapNotificacion>[]; totalNoLeidas: number; total: number }>;
	findNotificacion: (uuid: string, userId: string) => Promise<ReturnType<typeof mapNotificacion> | null>;
	marcarLeida: (notificacionUuid: string, userId: string) => Promise<ReturnType<typeof mapNotificacion>>;
	marcarTodasLeidas: (userId: string) => Promise<{ actualizadas: number }>;
	contarNoLeidas: (userId: string) => Promise<number>;
}

export class NotificacionService implements INotificacionService {
	private pushNotificationService: PushNotificationService;

	constructor() {
		const pushTokenService = new PushTokenService();
		this.pushNotificationService = new PushNotificationService({ pushTokenService });
	}

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

		const mappedAviso = mapAviso(result);
		this.pushNotificationService.sendPushToUsers(userIds, mappedAviso).catch(() => {});

		return mappedAviso;
	};

	findNotificacion = async (uuid: string, userId: string) => {
		const notificacion = await prismaClient.notificacion.findUnique({
			where: { uuid, userId },
			include: { aviso: true },
		});
		return notificacion ? mapNotificacion(notificacion) : null;
	};

	getNotificaciones = async (userId: string, { limit = 20, offset = 0, filters = {} }: queryParams) => {
		const { leida } = filters;
		const where = {
			userId,
			leida: leida !== undefined ? leida === "true" : undefined,
		};

		const [notificaciones, totalNoLeidas, total] = await Promise.all([
			prismaClient.notificacion.findMany({
				where,
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
			prismaClient.notificacion.count({ where }),
		]);

		return {
			notificaciones: notificaciones.map((n) => mapNotificacion(n)),
			totalNoLeidas,
			total,
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

	listAvisos = async ({ limit = 10, offset = 0, filters = {} }: avisoQueryParams) => {
		const { tipo, fechaDesde, fechaHasta, userId } = filters;

		const where = {
			...(tipo ? { tipo } : {}),
			...(fechaDesde || fechaHasta
				? {
						fechaCreacion: {
							...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
							...(fechaHasta ? { lte: new Date(fechaHasta) } : {}),
						},
					}
				: {}),
			...(userId
				? { notificaciones: { some: { userId } } }
				: {}),
		};

		const [avisos, total] = await Promise.all([
			prismaClient.aviso.findMany({
				where,
				orderBy: { fechaCreacion: "desc" },
				skip: offset,
				take: limit,
				include: {
					_count: { select: { notificaciones: true } },
				},
			}),
			prismaClient.aviso.count({ where }),
		]);

		return {
			avisos: avisos.map(({ _count, uuid, id: _id, ...rest }) => ({
				...rest,
				id: uuid,
				totalDestinatarios: _count.notificaciones,
			})),
			total,
		};
	};

	getAvisoDestinatarios = async (avisoUuid: string) => {
		const notificaciones = await prismaClient.notificacion.findMany({
			where: { avisoId: avisoUuid },
			include: {
				user: {
					select: { uuid: true, username: true, role: true },
				},
			},
		});

		return notificaciones.map(({ user, leida, fechaLectura }) => ({
			id: user.uuid,
			username: user.username,
			role: user.role,
			leida,
			fechaLectura,
		}));
	};
}
