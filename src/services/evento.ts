import { nanoid } from "nanoid";
import type { IEvento, IAddParticipantes, NominaDocumentFormat } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapEvento, mapEventoParticipante } from "../mappers/evento";
import { NotificacionService } from "./notificacion";
import { AppError, HttpCode } from "../utils";
import type { ScopingContext } from "../utils/helpers/buildScopingContext";
import { NominaParticipantes } from "../utils/classes/documentos/NominaParticipantes";

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
					select: { uuid: true, nombre: true, apellido: true, funcion: true },
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

	exportNominaDocumento = async (id: string, { format = "docx" }: { format?: NominaDocumentFormat } = {}) => {
		const nominaParticipantes = new NominaParticipantes({ eventoId: id });
		await nominaParticipantes.getData();
		await nominaParticipantes.fill({ format });

		return {
			buffer: nominaParticipantes.dataBuffer,
			fileName: nominaParticipantes.fileName,
			contentType: nominaParticipantes.contentType,
		};
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

	private getTipoParticipantePorScout = (funcion?: string | null) => {
		const funcionNormalizada = funcion?.trim().toUpperCase() || "";

		if (!funcionNormalizada || funcionNormalizada === "JOVEN") {
			return "JOVEN_PROTAGONISTA";
		}

		if (
			funcionNormalizada.includes("JEFE")
			|| funcionNormalizada.includes("SUBJEFE")
			|| funcionNormalizada.includes("AYUDANTE")
			|| funcionNormalizada.includes("EDUCADOR")
			|| funcionNormalizada.includes("DIRIGENTE")
			|| funcionNormalizada.includes("COLABORADOR")
			|| funcionNormalizada.includes("ACOMPAÑANTE")
		) {
			return "EDUCADOR";
		}

		return "JOVEN_PROTAGONISTA";
	};

	addParticipantes = async (eventoId: string, { scoutId, equipoId, rama }: IAddParticipantes, scopingContext?: ScopingContext) => {
		const evento = await prismaClient.evento.findUnique({
			where: { uuid: eventoId },
			select: { uuid: true, nombre: true },
		});

		if (!evento) return [];

		let scouts: Array<{ uuid: string; rama: string | null; funcion: string | null }> = [];

		if (scoutId) {
			scouts = await prismaClient.scout.findMany({
				where: { uuid: scoutId, estado: "ACTIVO" },
				select: { uuid: true, rama: true, funcion: true },
			});
		} else if (equipoId) {
			scouts = await prismaClient.scout.findMany({
				where: { equipoId, estado: "ACTIVO" },
				select: { uuid: true, rama: true, funcion: true },
			});
		} else if (rama) {
			scouts = await prismaClient.scout.findMany({
				where: { rama, estado: "ACTIVO" },
				select: { uuid: true, rama: true, funcion: true },
			});
		}

		const scoutIds = scouts.map((s) => s.uuid);
		if (scoutIds.length === 0) return [];

		if (scopingContext?.scope === "RAMA" && scopingContext.rama) {
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
		const scoutsNuevos = scouts.filter((s) => !existentesSet.has(s.uuid));

		if (scoutsNuevos.length > 0) {
			await prismaClient.eventoParticipante.createMany({
				data: scoutsNuevos.map((scoutNuevo) => ({
					uuid: nanoid(10),
					eventoId,
					scoutId: scoutNuevo.uuid,
					tipoParticipante: this.getTipoParticipantePorScout(scoutNuevo.funcion),
				})),
			});
		}

		const notificacionesPorTipo = new Map<string, string[]>();
		for (const scoutNuevo of scoutsNuevos) {
			const tipo = this.getTipoParticipantePorScout(scoutNuevo.funcion);
			const ids = notificacionesPorTipo.get(tipo) || [];
			ids.push(scoutNuevo.uuid);
			notificacionesPorTipo.set(tipo, ids);
		}

		for (const [tipo, ids] of notificacionesPorTipo.entries()) {
			this.notificarParticipantes({
				eventoId,
				eventoNombre: evento.nombre,
				scoutIds: ids,
				tipoParticipante: tipo,
			}).catch(() => {});
		}

		const participantes = await prismaClient.eventoParticipante.findMany({
			where: { eventoId, scoutId: { in: scoutIds } },
		});
		return participantes.map(mapEventoParticipante);
	};

	removeParticipante = async (eventoId: string, participanteId: string) => {
		const item = await prismaClient.eventoParticipante.findFirst({
			where: {
				eventoId,
				OR: [{ uuid: participanteId }, { scoutId: participanteId }],
			},
		});

		if (!item) {
			throw new AppError({
				name: "NOT_FOUND",
				description: "Participante no encontrado para este evento",
				httpCode: HttpCode.NOT_FOUND,
			});
		}

		await prismaClient.eventoParticipante.delete({
			where: { uuid: item.uuid },
		});

		return mapEventoParticipante(item);
	};

	removeAllParticipantes = async (eventoId: string) => {
		const { count } = await prismaClient.eventoParticipante.deleteMany({
			where: { eventoId },
		});

		return { removed: count };
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
