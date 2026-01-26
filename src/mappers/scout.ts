import { Scout } from "@prisma/client";
import { getAge } from "../utils";

export const mapScout = <T extends Scout>(scout: T) => {
    const { uuid, ...rest } = scout;
    return {
        ...rest,
        id: uuid,
        edad: getAge(scout.fechaNacimiento),
    };
};

export const mapPartialScout = <T extends Partial<Scout> & { uuid: string; fechaNacimiento: Date }>(scout: T) => {
    const { uuid, ...rest } = scout;
    return {
        ...rest,
        id: uuid,
        edad: getAge(scout.fechaNacimiento),
    };
};
