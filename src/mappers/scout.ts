import type { Scout } from "@prisma/client";
import { getAge } from "../utils";
import type { ProgresionType, RamasType } from "../types";

export const mapScout = <T extends Scout>(scout: T) => {
	const { uuid, ...rest } = scout;
	return {
		...rest,
		progresionActual: scout.progresionActual as ProgresionType | null,
		rama: scout.rama as RamasType | null,
		id: uuid,
		edad: getAge(scout.fechaNacimiento),
	};
};

export const mapPartialScout = <
	T extends Partial<Scout> & { uuid: string; fechaNacimiento: Date },
>(
	scout: T,
) => {
	const { uuid, ...rest } = scout;
	return {
		...rest,
		id: uuid,
		edad: getAge(scout.fechaNacimiento),
	};
};
