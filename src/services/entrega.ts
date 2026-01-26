import { nanoid } from "nanoid";
import { FuncionType, IEntrega, IEntregaData, ProgresionType, RamasType, TipoEntregaType } from "../types";
import { prismaClient } from "../utils/lib/prisma-client";
import { mapEntregaRealizada } from "../mappers/entrega";
import { mapPartialScout } from "../mappers/scout";

type queryParams = {
    limit?: number;
    offset?: number;
    filters?: {
        nombre?: string;
        scoutId?: string;
        tiempoDesde?: Date;
        tiempoHasta?: Date;
        tipoEntrega?: TipoEntregaType[]
        equipos?: string[];
        funciones?: FuncionType[];
        ramas?: RamasType[];
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
        const responseInsert = await prismaClient.entregaRealizada.create({
            data: {
                uuid: nanoid(10),
                ...entrega,
            },
            include: {
                scout: {
                    select: {
                        id: true,
                        uuid: true,
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

        if (entrega.tipoEntrega.includes("PROG")) {
            const progresion = entrega.tipoEntrega.split("PROG")[1] as ProgresionType

            await prismaClient.scout.update({
                where: {
                    uuid: entrega.scoutId
                },
                data: {
                    progresionActual: progresion
                }
            })
        }

        const { scout, ...entregaData } = responseInsert;
        return {
            ...mapEntregaRealizada(entregaData),
            scout: mapPartialScout(scout)
        } as any;
    };

    getEntregas = async ({ limit = 15, offset = 0, filters = {} }: queryParams) => {
        const {
            nombre = "",
            scoutId,
            tipoEntrega,
            tiempoDesde,
            tiempoHasta,
            funciones,
            equipos,
            progresiones,
            ramas
        } = filters;

        const responseItem = await prismaClient.entregaRealizada.findMany({
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
                    equipo: {
                        uuid: equipos ? { in: equipos } : undefined,
                    },
                    progresionActual: {
                        in: progresiones,
                    },
                    funcion: {
                        in: funciones,
                    },
                    rama: {
                        in: ramas,
                    },
                    uuid: scoutId
                },
            },
            include: {
                scout: {
                    select: {
                        id: true,
                        uuid: true,
                        nombre: true,
                        apellido: true,
                        dni: true,
                        funcion: true,
                        sexo: true,
                        fechaNacimiento: true,
                    },
                },
            },
        });
        return responseItem.map(item => {
            const { scout, ...entregaData } = item;
            return {
                ...mapEntregaRealizada(entregaData),
                scout: mapPartialScout(scout)
            } as any;
        });
    };

    getEntrega = async (id: string) => {
        try {
            const responseItem = await prismaClient.entregaRealizada.findUnique({
                where: { uuid: id },
                include: {
                    scout: {
                        select: {
                            id: true,
                            uuid: true,
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

            if (!responseItem) return null;

            const { scout, ...entregaData } = responseItem;
            return {
                ...mapEntregaRealizada(entregaData),
                scout: mapPartialScout(scout)
            } as any;
        } catch (error) {
            return null;
        }
    };

    updateEntrega = async (id: string, { scoutId, ...dataUpdated }: IEntrega) => {
        try {
            const responseItem = await prismaClient.entregaRealizada.update({
                where: { uuid: id },
                data: {
                    ...dataUpdated,
                    scoutId,
                },
                include: {
                    scout: {
                        select: {
                            id: true,
                            uuid: true,
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

            const { scout, ...entregaData } = responseItem;
            return {
                ...mapEntregaRealizada(entregaData),
                scout: mapPartialScout(scout)
            } as any;
        } catch (error) {
            return null;
        }
    };

    deleteEntrega = async (id: string): Promise<IEntregaData | null> => {
        try {
            const responseItem = await prismaClient.entregaRealizada.delete({
                where: { uuid: id },
                include: {
                    scout: {
                        select: {
                            id: true,
                            uuid: true,
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

            const { scout, ...entregaData } = responseItem;
            return {
                ...mapEntregaRealizada(entregaData),
                scout: mapPartialScout(scout)
            } as any;
        } catch (error) {
            return null;
        }
    };
}
