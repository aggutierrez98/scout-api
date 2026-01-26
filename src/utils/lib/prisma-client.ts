import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { SecretsManager } from "../classes/SecretsManager";

let prisma: PrismaClient | null = null;

export const initPrisma = async () => {
    if (prisma) return prisma;

    if (!SecretsManager.getInstance().initialized) {
        throw new Error("SecretsManager no inicializado");
    }

    const { DATABASE_URL, AUTH_TOKEN } =
        SecretsManager.getInstance().getTursoSecrets();

    const adapter = new PrismaLibSql({
        url: DATABASE_URL,
        authToken: AUTH_TOKEN,
    });

    prisma = new PrismaClient({ adapter });
    return prisma;
};

export const prismaClient = new Proxy(
    {} as PrismaClient,
    {
        get(_target, prop) {
            if (!prisma) {
                // throw new Error(
                //     "PrismaClient no inicializado. Llamá a initPrisma() antes de usarlo."
                // );
                initPrisma();
            }

            const value = (prisma as any)[prop];
            return typeof value === "function" ? value.bind(prisma) : value;
        },
    }
);
