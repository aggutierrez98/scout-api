import { SecretsManager } from "../utils/classes/SecretsManager";
import { initPrisma } from "../utils/lib/prisma-client";

const MODELOS: string[] = [
	"notificacion",
	"pushToken",
	"condonacionPago",
	"imputacionPago",
	"eventoParticipante",
	"documentoPresentado",
	"entregaRealizada",
	"tipoEventoDocumentoParticipante",
	"tipoEventoDocumento",
	"reciboPago",
	"pago",
	"obligacionPago",
	"saldoAFavor",
	"reglaDescuentoFamiliar",
	"reglaDescuentoPagoAnual",
	"reglaCuotaMensual",
	"reglaAfiliacion",
	"familiarScout",
	"evento",
	"user",
	"scout",
	"familiar",
	"equipo",
	"documento",
	"tipoEvento",
	"cicloReglasPago",
	"aviso",
];

const isForeignKeyError = (error: unknown) =>
	(error as Error)?.message?.includes("FOREIGN KEY constraint failed") ?? false;

const deleteDBData = async () => {
	let prismaClient;

	try {
		console.time("Tiempo de ejecucion");
		console.log("------------ INICIANDO ELIMINACION DENTRO DE DB -------------\n");

		await SecretsManager.getInstance().initialize();
		prismaClient = (await import("../utils/lib/prisma-client")).prismaClient;
		await initPrisma();
		if (!prismaClient) {
			throw new Error("Prisma Client no inicializado");
		}

		const pendientes = [...MODELOS];
		let pasada = 0;

		while (pendientes.length > 0) {
			pasada += 1;
			let progreso = false;

			for (let i = pendientes.length - 1; i >= 0; i -= 1) {
				const modelName = pendientes[i];
				try {
					const result = await (prismaClient as any)[modelName].deleteMany({});
					console.log(
						`[pasada ${pasada}] - ${modelName}: ${result.count ?? 0} registro(s) eliminados`,
					);
					pendientes.splice(i, 1);
					progreso = true;
				} catch (error) {
					if (isForeignKeyError(error)) {
						continue;
					}
					throw new Error(`Error eliminando ${modelName}: ${(error as Error).message}`);
				}
			}

			if (!progreso) {
				throw new Error(
					`No se pudo resolver el orden de eliminación por FK. Pendientes: ${pendientes.join(", ")}`,
				);
			}
		}

		console.timeEnd("Tiempo de ejecucion");
	} catch (error) {
		console.log("Error en el script: ", (error as Error).message);
	} finally {
		if (prismaClient) {
			await (prismaClient as any).$disconnect();
		}
	}
};

deleteDBData();
