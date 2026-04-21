import { nanoid } from "nanoid";
import { IEvento, IAddParticipantes } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapEvento, mapEventoParticipante } from "../mappers/evento";
import { NotificacionService } from "./notificacion";
import { AppError, HttpCode } from "../utils";
import type { ScopingContext } from "../utils/helpers/buildScopingContext";

type queryParams = {
	limit?: number;
	offset?: number;
	filters?: {
		nombre?: string;
		fechaDesde?: Date;
		fechaHasta?: Date;
	};
};

export class EventoService {
	private notificacionService = new NotificacionService();

	private participantesInclude = {
		participantes: {
			include: {
				scout: {
					select: { uuid: true, nombre: true, apellido: true },
				},
			},
		},
	} as const;

	private eventoInclude = {
		tipoEvento: {
			include: {
				documentosEvento: { include: { documento: true } },
				documentosParticipante: { include: { documento: true } },
			},
		},
		...this.participantesInclude,
	} as const;

	getEventos = async ({ limit = 5, offset = 0, filters = {} }: queryParams) => {
		const { nombre, fechaDesde, fechaHasta } = filters;
		const items = await prismaClient.evento.findMany({
			where: {
				activo: true,
				nombre: nombre ? { contains: nombre } : undefined,
				fechaHoraInicio: { gte: fechaDesde, lte: fechaHasta },
			},
			skip: offset,
			take: limit,
			orderBy: { fechaHoraInicio: "desc" },
			include: { tipoEvento: true },
		});
		return items.map(mapEvento);
	};

	getEvento = async (id: string) => {
		const item = await prismaClient.evento.findUnique({
			where: { uuid: id },
			include: this.eventoInclude,
		});
		return item ? mapEvento(item) : null;
	};

	getMisEventos = async (userId: string) => {
		const user = await prismaClient.user.findUnique({
			where: { uuid: userId },
			select: {
				role: true,
				scoutId: true,
				familiar: {
					select: {
						padreScout: {
							select: { scoutId: true },
						},
					},
				},
			},
		});

		if (!user) return [];

		const scoutIds: string[] = [];

		if (user.familiar?.padreScout) {
			scoutIds.push(...user.familiar.padreScout.map((fs) => fs.scoutId));
		}

		const educadorRoles = ["AYUDANTE_RAMA", "SUBJEFE_RAMA", "JEFE_RAMA", "SUBJEFE_GRUPO", "JEFE_GRUPO", "JEFE_GRUPO"];
		if (user.scoutId && educadorRoles.includes(user.role)) {
			scoutIds.push(user.scoutId);
		}

		if (scoutIds.length === 0) return [];

		const participaciones = await prismaClient.eventoParticipante.findMany({
			where: { scoutId: { in: scoutIds } },
			include: {
				evento: {
					include: {
						tipoEvento: {
							include: {
								documentosEvento: { include: { documento: true } },
								documentosParticipante: { include: { documento: true } },
							},
						},
					},
				},
			},
			orderBy: { evento: { fechaHoraInicio: "desc" } },
		});

		const eventosMap = new Map<string, ReturnType<typeof mapEvento> & { miParticipacion?: { tipoParticipante: string } }>();

		for (const p of participaciones) {
			const eventoMapped = mapEvento(p.evento);
			eventosMap.set(p.eventoId, {
				...eventoMapped,
				miParticipacion: { tipoParticipante: p.tipoParticipante },
			});
		}

		return Array.from(eventosMap.values());
	};

	insertEvento = async (data: IEvento) => {
		const item = await prismaClient.evento.create({
			data: { ...data, uuid: nanoid(10) },
			include: this.eventoInclude,
		});
		return mapEvento(item);
	};

	updateEvento = async (id: string, data: Partial<IEvento>) => {
		const item = await prismaClient.evento.update({
			where: { uuid: id },
			data,
			include: this.eventoInclude,
		});
		return mapEvento(item);
	};

	deleteEvento = async (id: string) => {
		const item = await prismaClient.evento.update({
			where: { uuid: id },
			data: { activo: false },
			include: { tipoEvento: true },
		});
		return mapEvento(item);
	};

	addParticipantes = async (eventoId: string, { scoutId, equipoId, rama, tipoParticipante }: IAddParticipantes, scopingContext?: ScopingContext) => {
		const evento = await prismaClient.evento.findUnique({
			where: { uuid: eventoId },
			select: { uuid: true, nombre: true },
		});

		if (!evento) return [];

		let scoutIds: string[] = [];

		if (scoutId) {
			scoutIds = [scoutId];
		} else if (equipoId) {
			const scouts = await prismaClient.scout.findMany({
				where: { equipoId, estado: "ACTIVO" },
				select: { uuid: true },
			});
			scoutIds = scouts.map((s) => s.uuid);
		} else if (rama) {
			const scouts = await prismaClient.scout.findMany({
				where: { rama, estado: "ACTIVO" },
				select: { uuid: true },
			});
			scoutIds = scouts.map((s) => s.uuid);
		}

		if (scoutIds.length === 0) return [];

		if (scopingContext?.scope === 'RAMA' && scopingContext.rama) {
			const scouts = await prismaClient.scout.findMany({
				where: { uuid: { in: scoutIds } },
				select: { uuid: true, rama: true },
			});
			const outsideRama = scouts.filter((s) => s.rama !== scopingContext.rama);
			if (outsideRama.length > 0) {
				throw new AppError({
					name: "UNAUTHORIZED",
					description: "No podés agregar participantes de otra rama",
					httpCode: HttpCode.FORBIDDEN,
				});
			}
		}

		const existentes = await prismaClient.eventoParticipante.findMany({
			where: { eventoId, scoutId: { in: scoutIds } },
			select: { scoutId: true },
		});
		const existentesSet = new Set(existentes.map((e) => e.scoutId));
		const nuevosScoutIds = scoutIds.filter((sid) => !existentesSet.has(sid));

		if (nuevosScoutIds.length > 0) {
			await prismaClient.eventoParticipante.createMany({
				data: nuevosScoutIds.map((sid) => ({
					uuid: nanoid(10),
					eventoId,
					scoutId: sid,
					tipoParticipante,
				})),
			});
		}

		this.notificarParticipantes({ eventoId, eventoNombre: evento.nombre, scoutIds, tipoParticipante }).catch(() => {});

		const participantes = await prismaClient.eventoParticipante.findMany({
			where: { eventoId, scoutId: { in: scoutIds } },
		});
		return participantes.map(mapEventoParticipante);
	};

	removeParticipante = async (participanteId: string) => {
		const item = await prismaClient.eventoParticipante.delete({
			where: { uuid: participanteId },
		});
		return mapEventoParticipante(item);
	};

	private notificarParticipantes = async ({
		eventoId,
		eventoNombre,
		scoutIds,
		tipoParticipante,
	}: {
		eventoId: string;
		eventoNombre: string;
		scoutIds: string[];
		tipoParticipante: string;
	}) => {
		const userIds: string[] = [];

		if (tipoParticipante === "JOVEN_PROTAGONISTA") {
			const familiares = await prismaClient.familiarScout.findMany({
				where: { scoutId: { in: scoutIds } },
				include: { familiar: { include: { user: { select: { uuid: true } } } } },
			});
			for (const fs of familiares) {
				if (fs.familiar.user?.uuid) userIds.push(fs.familiar.user.uuid);
			}
		} else if (tipoParticipante === "EDUCADOR") {
			const users = await prismaClient.user.findMany({
				where: { scoutId: { in: scoutIds } },
				select: { uuid: true },
			});
			for (const u of users) userIds.push(u.uuid);
		}

		if (userIds.length === 0) return;

		await this.notificacionService.crearAviso({
			titulo: "Nuevo evento",
			mensaje: `Fuiste agregado al evento: ${eventoNombre}`,
			tipo: "EVENTO",
			referenciaId: eventoId,
			referenciaTipo: "evento",
			userIds,
		});
	};
}
