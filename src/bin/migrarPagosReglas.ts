import { SecretsManager } from "../utils/classes/SecretsManager";
import { initPrisma, prismaClient } from "../utils/lib/prisma-client";
import { ServicioObligacionesPago } from "../services/servicioObligacionesPago";

const main = async () => {
	await SecretsManager.getInstance().initialize();
	await initPrisma();

	const servicioObligaciones = new ServicioObligacionesPago();
	const ciclo = await servicioObligaciones.obtenerCicloActivo();
	const result = await servicioObligaciones.generarObligacionesCiclo(ciclo.uuid, {
		forzarRecrear: true,
	});

	const obligaciones = await (prismaClient as any).obligacionPago.findMany({
		where: { cicloId: ciclo.uuid },
		include: { imputaciones: true },
	});

	const inconsistencias = obligaciones.filter((item: any) => {
		const montoImputado = (item.imputaciones ?? []).reduce(
			(acc: number, imp: any) => acc + imp.montoImputado,
			0,
		);
		const pendiente = Number((item.montoEsperado - item.montoCondonado - montoImputado).toFixed(2));
		if (item.estado === "AL_DIA" && pendiente > 0) return true;
		if (item.estado !== "AL_DIA" && pendiente <= 0) return true;
		return false;
	});

	console.log("=== Migración motor de pagos ===");
	console.log(`Ciclo: ${ciclo.anio} (${ciclo.uuid})`);
	console.log(`Obligaciones regeneradas: ${result.obligacionesGeneradas}`);
	console.log(`Inconsistencias detectadas: ${inconsistencias.length}`);

	if (inconsistencias.length > 0) {
		console.log("Listado para revisión manual:");
		for (const item of inconsistencias.slice(0, 50)) {
			console.log(
				`- ${item.uuid} | ${item.tipo} | ${item.periodo} | estado=${item.estado} | scout=${item.scoutId ?? "-"}`,
			);
		}
	}

	await prismaClient.$disconnect();
};

main().catch(async (error) => {
	console.error("Error ejecutando migración operativa de pagos:", error);
	await prismaClient.$disconnect();
	process.exit(1);
});
