import { Familiar } from "@prisma/client";
import { getAge } from "../utils";

export const mapFamiliar = <T extends Familiar>(familiar: T) => {
    const { uuid, ...rest } = familiar;
    return {
        ...rest,
        id: uuid,
        edad: getAge(familiar.fechaNacimiento),
    };
};
