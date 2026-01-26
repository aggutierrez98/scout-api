import { EntregaRealizada } from "@prisma/client";

export const mapEntregaRealizada = <T extends EntregaRealizada>(entrega: T) => {
    const { uuid, ...rest } = entrega;
    return {
        ...rest,
        id: uuid,
    };
};
