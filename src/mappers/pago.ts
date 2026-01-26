import { Pago } from "@prisma/client";

export const mapPago = <T extends Pago>(pago: T) => {
    const { uuid, ...rest } = pago;
    return {
        ...rest,
        id: uuid,
    };
};
