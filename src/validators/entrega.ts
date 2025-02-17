import { z } from "zod";
import { IEntrega } from "../types";
import { validScoutID } from "./scout";
import { VALID_ENTREGAS_TYPE } from "../utils";
import { ISODateStringReg } from "../utils/regex";
import { IdSchema, QuerySearchSchema } from "./generics";
import { prismaClient } from "../utils/lib/prisma-client";
const validEntregaId = async (id: string) => {
    const EntregaModel = prismaClient.entregaRealizada;
    const respItem = await EntregaModel.findUnique({ where: { uuid: id } });
    return !!respItem;
};

export const EntregaSchema = z.object({
    tipoEntrega: z.enum(VALID_ENTREGAS_TYPE),
    scoutId: IdSchema.refine(validScoutID),
    fechaEntrega: z.string().pipe(z.coerce.date()),
}) satisfies z.Schema<IEntrega>;

export const GetEntregasSchema = z.object({
    query: QuerySearchSchema.extend({
        // equipo: z.string().max(10).regex(numberReg).optional(),
        // nombre: z.string().max(85).regex(nameRegex).optional(),
        tiempoDesde: z.string().regex(ISODateStringReg).optional(),
        tiempoHasta: z.string().regex(ISODateStringReg).optional(),
        // concepto: z.string().max(50).optional(),
        // funcion: z.enum(VALID_FUNCTIONS).optional(),
    }),
});

export const GetEntregaSchema = z.object({
    params: z.object({
        id: IdSchema.refine(validEntregaId),
    }),
});

export const PostEntregaSchema = z.object({
    body: EntregaSchema,
}).refine(async ({ body }) => {
    const EntregaRealizaModel = prismaClient.entregaRealizada;
    const respItem = await EntregaRealizaModel.findFirst({
        where: { scoutId: body.scoutId, tipoEntrega: body.tipoEntrega },
    });

    return !respItem
}, "Los parametros enviados ya estan registrados como entrega dentro del sistema");

export const PutEntregaSchema = z.object({
    params: z.object({
        id: IdSchema.refine(validEntregaId),
    }),
    body: EntregaSchema.deepPartial(),
}).refine(async ({ body }) => {
    const EntregaRealizaModel = prismaClient.entregaRealizada;
    const respItem = await EntregaRealizaModel.findFirst({
        where: { scoutId: body.scoutId, tipoEntrega: body.tipoEntrega },
    });

    return !respItem
}, "Los parametros enviados ya estan registrados como entrega dentro del sistema");

export const DeleteEntregaSchema = z.object({
    params: z.object({
        id: IdSchema.refine(validEntregaId),
    }),
});
