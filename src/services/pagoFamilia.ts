import { prismaClient } from "../utils/lib/prisma-client";

type MapaFamilia = {
	scoutToFamilia: Map<string, string>;
	familiaToScouts: Map<string, string[]>;
};

const normalizarClaveFamilia = (scoutIds: string[]) => `familia::${scoutIds.sort().join("|")}`;

export const construirMapaFamilias = async (): Promise<MapaFamilia> => {
	const [relaciones, scouts] = await Promise.all([
		prismaClient.familiarScout.findMany({
			select: {
				scoutId: true,
				familiarId: true,
			},
		}),
		prismaClient.scout.findMany({
			select: { uuid: true },
		}),
	]);

	const scoutToFamiliar = new Map<string, Set<string>>();
	const familiarToScout = new Map<string, Set<string>>();

	for (const rel of relaciones) {
		if (!scoutToFamiliar.has(rel.scoutId)) scoutToFamiliar.set(rel.scoutId, new Set());
		if (!familiarToScout.has(rel.familiarId)) familiarToScout.set(rel.familiarId, new Set());
		scoutToFamiliar.get(rel.scoutId)!.add(rel.familiarId);
		familiarToScout.get(rel.familiarId)!.add(rel.scoutId);
	}

	const scoutToFamilia = new Map<string, string>();
	const familiaToScouts = new Map<string, string[]>();
	const scoutsVisitados = new Set<string>();

	for (const scout of scouts) {
		if (scoutsVisitados.has(scout.uuid)) continue;

		const cola = [scout.uuid];
		const componenteScouts = new Set<string>();
		const familiaresVisitados = new Set<string>();

		while (cola.length > 0) {
			const scoutId = cola.shift()!;
			if (scoutsVisitados.has(scoutId)) continue;
			scoutsVisitados.add(scoutId);
			componenteScouts.add(scoutId);

			const familiares = scoutToFamiliar.get(scoutId) ?? new Set<string>();
			for (const familiarId of familiares) {
				if (familiaresVisitados.has(familiarId)) continue;
				familiaresVisitados.add(familiarId);
				const scoutsRelacionados = familiarToScout.get(familiarId) ?? new Set<string>();
				for (const scoutRelacionado of scoutsRelacionados) {
					if (!scoutsVisitados.has(scoutRelacionado)) {
						cola.push(scoutRelacionado);
					}
				}
			}
		}

		const scoutsFamilia = Array.from(componenteScouts).sort();
		const familiaClave = normalizarClaveFamilia(scoutsFamilia);
		familiaToScouts.set(familiaClave, scoutsFamilia);
		for (const scoutId of scoutsFamilia) {
			scoutToFamilia.set(scoutId, familiaClave);
		}
	}

	return { scoutToFamilia, familiaToScouts };
};

export const obtenerFamiliaClavePorScout = async (scoutId: string): Promise<string> => {
	const { scoutToFamilia } = await construirMapaFamilias();
	return scoutToFamilia.get(scoutId) ?? normalizarClaveFamilia([scoutId]);
};

export const obtenerScoutIdsPorFamiliar = async (familiarId: string): Promise<string[]> => {
	const relaciones = await prismaClient.familiarScout.findMany({
		where: { familiarId },
		select: { scoutId: true },
	});
	return relaciones.map((item) => item.scoutId);
};
