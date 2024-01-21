import { nanoid } from "nanoid";
import { FuncionType, IEntrega, IEntregaData, ProgresionType, TipoEntregaType } from "../types";
import { PrismaClient } from "@prisma/client";
import { getAge } from "../utils";

const prisma = new PrismaClient().$extends({
    result: {
        entregaRealizada: {
            id: {
                compute: (data) => data.uuid,
            },
            uuid: {
                compute: () => undefined,
            },
        },
        scout: {
            id: {
                compute: (data) => data.uuid,
            },
            uuid: {
                compute: () => undefined,
            },
            edad: {
                needs: { fechaNacimiento: true },
                compute(scout) {
                    return getAge(scout.fechaNacimiento)
                },
            }
        },
    },
});
const EntregaModel = prisma.entregaRealizada;

type queryParams = {
    limit?: number;
    offset?: number;
    filters?: {
        tiempoDesde?: Date;
        tiempoHasta?: Date;
        nombre?: string;
        tipoEntrega?: TipoEntregaType[]
        patrullas?: string[];
        funciones?: FuncionType[];
        progresiones?: ProgresionType[]
    };
};

interface IEntregaService {
    insertEntrega: (entrega: IEntrega) => Promise<IEntregaData | null>;
    getEntregas: ({ limit, offset, filters }: queryParams) => Promise<IEntregaData[]>;
    getEntrega: (id: string) => Promise<IEntregaData | null>;
    updateEntrega: (id: string, dataUpdated: IEntrega) => Promise<IEntregaData | null>;
    deleteEntrega: (id: string) => Promise<IEntregaData | null>;
}

export class EntregaService implements IEntregaService {
    insertEntrega = async (entrega: IEntrega) => {
        const responseInsert = await EntregaModel.create({
            data: {
                uuid: nanoid(10),
                ...entrega,
            },
            include: {
                scout: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        dni: true,
                        funcion: true,
                        fechaNacimiento: true,
                        edad: true,
                        sexo: true,
                        telefono: true,
                    },
                },
            },
        });
        return responseInsert;
    };

    getEntregas = async ({ limit = 15, offset = 0, filters = {} }: queryParams) => {
        const {
            nombre = "",
            tipoEntrega,
            tiempoDesde,
            tiempoHasta,
            funciones,
            patrullas,
            progresiones
        } = filters;

        const responseItem = await EntregaModel.findMany({
            skip: offset,
            take: limit,
            orderBy: { fechaEntrega: "desc" },
            where: {
                tipoEntrega: {
                    in: tipoEntrega,
                },
                fechaEntrega: {
                    lte: tiempoHasta,
                    gte: tiempoDesde,
                },
                scout: {
                    OR: [
                        {
                            nombre: {
                                contains: nombre,
                            },
                        },
                        {
                            apellido: {
                                contains: nombre,
                            },
                        },
                    ],
                    patrulla: {
                        uuid: patrullas ? { in: patrullas } : undefined,
                    },
                    progresionActual: {
                        in: progresiones,
                    },
                    funcion: {
                        in: funciones,
                    },
                },
            },
            include: {
                scout: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        dni: true,
                        funcion: true,
                        sexo: true,
                    },
                },
            },
        });
        return responseItem;
    };

    getEntrega = async (id: string) => {
        try {
            const responseItem = await EntregaModel.findUnique({
                where: { uuid: id },
                include: {
                    scout: {
                        select: {
                            id: true,
                            nombre: true,
                            apellido: true,
                            dni: true,
                            funcion: true,
                            fechaNacimiento: true,
                            sexo: true,
                            telefono: true,
                        },
                    },
                },
            });

            return responseItem;
        } catch (error) {
            return null;
        }
    };

    updateEntrega = async (id: string, { scoutId, ...dataUpdated }: IEntrega) => {
        const responseItem = await EntregaModel.update({
            where: { uuid: id },
            data: {
                ...dataUpdated,
                scoutId,
            },
        });

        return responseItem;
    };

    deleteEntrega = async (id: string) => {
        const responseItem = await EntregaModel.delete({ where: { uuid: id } });
        return responseItem;
    };
}
