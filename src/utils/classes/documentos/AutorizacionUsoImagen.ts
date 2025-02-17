import { Familiar, Scout } from "@prisma/client";
import { prismaClient } from "../../lib/prisma-client";
import { AppError, HttpCode } from "../AppError";
import { BaseConstructorProps, PdfDocument } from "./PdfDocument";

interface ConstructorProps extends BaseConstructorProps {
    scoutId: string
    familiarId: string
}

interface Data {
    scoutId?: string,
    familiarId?: string
    familiar?: Familiar
    scout?: Scout
}

export class AutorizacionUsoImagen extends PdfDocument {
    data: Data = {}

    constructor({ scoutId, familiarId, ...props }: ConstructorProps) {
        super(props)
        this.data = { scoutId, familiarId }
        this.options = {
            fontColor: "#000",
            fontSize: 9,
        }
    }

    async getData() {

        const familiar = await prismaClient.familiar.findUnique({
            where: {
                uuid: this.data.familiarId
            },
            include: {
                padreScout: {
                    where: {
                        scoutId: {
                            equals: this.data.scoutId
                        }
                    },
                    include: {
                        scout: true
                    }
                },
            },
        })

        if (!familiar || !familiar?.padreScout[0].scout) throw new AppError({
            name: "NOT_FOUND",
            httpCode: HttpCode.BAD_REQUEST,
            description: "No se encontraron datos del familiar o el scout"
        });

        this.data = {
            familiar,
            scout: familiar.padreScout[0].scout
        }
    }
    mapData() {
        const { nombre, apellido, dni, direccion } = this.data.familiar!
        const { nombre: nombreScout, apellido: apellidoScout, dni: dniScout } = this.data.scout!

        return {
            "Nombre": `${apellido} ${nombre}`,
            "Domicilio": direccion,
            "Nombre_scout": `${apellidoScout} ${nombreScout}`,
            "Nombre_scout_2": `${apellidoScout} ${nombreScout}`,
            "DNI_menor": dniScout,
            "DNI": dni,
            "Firma_aclaracion": `${apellido} ${nombre}`,
        }
    }

}
