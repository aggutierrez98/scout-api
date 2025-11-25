import { SecretsManager } from "../utils/classes/SecretsManager";

const deleteDBData = async () => {
    let prismaClient;

    try {
        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO ELIMINACION DENTRO DE DB -------------\n",
        );

        await SecretsManager.getInstance().initialize();
        prismaClient = (await import("../utils/lib/prisma-client")).prismaClient;
        if (!prismaClient) {
            throw new Error("Prisma Client no inicializado");
        }

        await prismaClient.familiarScout.deleteMany({})
        await prismaClient.familiar.deleteMany({})
        await prismaClient.documentoPresentado.deleteMany({})
        await prismaClient.entregaRealizada.deleteMany({})
        await prismaClient.pago.deleteMany({})
        await prismaClient.scout.deleteMany({})
        await prismaClient.equipo.deleteMany({})
        await prismaClient.documento.deleteMany({})

        console.timeEnd("Tiempo de ejecucion");
    } catch (error) {
        console.log("Error en el script: ", (error as Error).message);
    } finally {
        if (prismaClient) {
            await prismaClient.$disconnect();
        }
    }
};

deleteDBData();
