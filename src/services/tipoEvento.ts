import { nanoid } from "nanoid";
import { ITipoEvento } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapTipoEvento } from "../mappers/tipoEvento";

type queryParams = {
	limit?: number;
	offset?: number;
};

export class TipoEventoService {
	private include = {
		documentosEvento: { include: { documento: true } },
		documentosParticipante: { include: { documento: true } },
	} as const;

	getTiposEvento = async ({ limit = 50, offset = 0 }: queryParams) => {
		const items = await prismaClient.tipoEvento.findMany({
			where: { activo: true },
			skip: offset,
			take: limit,
			orderBy: { nombre: "asc" },
			include: this.include,
		});
		return items.map(mapTipoEvento);
	};

	getTipoEvento = async (id: string) => {
		const item = await prismaClient.tipoEvento.findUnique({
			where: { uuid: id },
			include: this.include,
		});
		return item ? mapTipoEvento(item) : null;
	};

	insertTipoEvento = async ({ nombre, documentosEventoIds, documentosParticipante }: ITipoEvento) => {
		const uuid = nanoid(10);
		const item = await prismaClient.tipoEvento.create({
			data: {
				uuid,
				nombre,
				documentosEvento: {
					create: documentosEventoIds.map((documentoId) => ({ documentoId })),
				},
				documentosParticipante: {
					create: documentosParticipante.map(({ documentoId, tipoParticipante }) => ({
						documentoId,
						tipoParticipante,
					})),
				},
			},
			include: this.include,
		});
		return mapTipoEvento(item);
	};

	updateTipoEvento = async (id: string, { nombre, documentosEventoIds, documentosParticipante }: Partial<ITipoEvento>) => {
		await prismaClient.$transaction(async (tx) => {
			if (documentosEventoIds !== undefined) {
				await tx.tipoEventoDocumento.deleteMany({ where: { tipoEventoId: id } });
				if (documentosEventoIds.length > 0) {
					await tx.tipoEventoDocumento.createMany({
						data: documentosEventoIds.map((documentoId) => ({ tipoEventoId: id, documentoId })),
					});
				}
			}

			if (documentosParticipante !== undefined) {
				await tx.tipoEventoDocumentoParticipante.deleteMany({ where: { tipoEventoId: id } });
				if (documentosParticipante.length > 0) {
					await tx.tipoEventoDocumentoParticipante.createMany({
						data: documentosParticipante.map(({ documentoId, tipoParticipante }) => ({
							tipoEventoId: id,
							documentoId,
							tipoParticipante,
						})),
					});
				}
			}

			if (nombre !== undefined) {
				await tx.tipoEvento.update({ where: { uuid: id }, data: { nombre } });
			}
		});

		const updated = await prismaClient.tipoEvento.findUnique({
			where: { uuid: id },
			include: this.include,
		});
		return updated ? mapTipoEvento(updated) : null;
	};

	deleteTipoEvento = async (id: string) => {
		const item = await prismaClient.tipoEvento.update({
			where: { uuid: id },
			data: { activo: false },
			include: this.include,
		});
		return mapTipoEvento(item);
	};
}
