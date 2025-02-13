import { PrismaClient } from "@prisma/client";

const deleteDBData = async () => {
    const prisma = new PrismaClient();
    await prisma.$connect()

    try {
        console.time("Tiempo de ejecucion");
        console.log(
            "------------ INICIANDO ELIMINACION DENTRO DE DB -------------\n",
        );

        await prisma.familiarScout.deleteMany({})
        await prisma.familiar.deleteMany({})
        await prisma.documentoPresentado.deleteMany({})
        await prisma.entregaRealizada.deleteMany({})
        await prisma.pago.deleteMany({})
        await prisma.scout.deleteMany({})
        await prisma.equipo.deleteMany({})
        await prisma.documento.deleteMany({})

        console.timeEnd("Tiempo de ejecucion");
    } catch (error) {
        console.log("Error en el script: ", (error as Error).message);
    } finally {
        await prisma.$disconnect();
    }
};

deleteDBData();
