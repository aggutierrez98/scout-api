import { Equipo } from "@prisma/client";

export const mapEquipo = <T extends Equipo>(equipo: T) => {
    const { uuid, ...rest } = equipo;
    return {
        ...rest,
        id: uuid,
    };
};
