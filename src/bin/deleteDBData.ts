import { prismaClient } from "../utils/lib/prisma-client";

const deleteDBData = async () => {

    try {
        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO ELIMINACION DENTRO DE DB -------------\n",
        );

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
        await prismaClient.$disconnect();
    }
};

deleteDBData();
