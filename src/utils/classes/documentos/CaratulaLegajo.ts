// import { Scout } from "@prisma/client";
import { VALID_RELATIONSHIPS } from "../../constants";
import { prismaClient } from "../../lib/prisma-client";
import { AppError, HttpCode } from "../AppError";
import { BaseConstructorProps, PdfDocument } from "./PdfDocument";

interface ConstructorProps extends BaseConstructorProps {
    scoutId: string
}

export class CaratulaLegajo extends PdfDocument {
    data: any = {}

    constructor({ scoutId, ...props }: ConstructorProps) {
        super(props)
        this.data = { scoutId }
    }

    async getData() {
        const scout = await prismaClient.scout.findUnique({
            where: {
                uuid: this.data.scoutId
            },
            include: {
                familiarScout: {
                    where: {
                        relacion: {
                            in: [VALID_RELATIONSHIPS[0], VALID_RELATIONSHIPS[1]]
                        }
                    },
                    select: {
                        relacion: true,
                        familiar: {
                            select: {
                                nombre: true,
                                apellido: true,
                                estadoCivil: true,
                            },
                        },

                    }
                }
            }
        })

        if (!scout) throw new AppError({
            name: "NOT_FOUND",
            httpCode: HttpCode.BAD_REQUEST,
            description: "No se encontraron datos del scout"
        });

        this.data = {
            scout
        }
    }
    mapData() {
        const { nombre, apellido, telefono, direccion, fechaNacimiento, familiarScout: familiares } = this.data.scout
        //@ts-ignore
        const familiaresData: { [key: string]: { nombre: string, estadoCivil: string } } = familiares.reduce((acc, { relacion, familiar }) => ({
            ...acc,
            [relacion || ""]: {
                nombre: `${familiar.apellido} ${familiar.nombre}`,
                estadoCivil: familiar.estadoCivil
            }
        }), {})

        return {
            "Nombre": `${apellido} ${nombre}`,
            "Domicilio": direccion,
            "Telefono": telefono || "",
            "Telefono_emergencia": telefono || "",
            "Fecha_nacimiento": fechaNacimiento.toLocaleDateString() || "",
            "Nombre_padre": familiaresData.PADRE.nombre || "",
            "Nombre_madre": familiaresData.MADRE.nombre || "",
            "Estado_civil_padres": familiaresData.PADRE.estadoCivil
        }
    }

}
