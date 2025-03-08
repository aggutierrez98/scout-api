import { Familiar, Scout } from "@prisma/client";
import { prismaClient } from "../../lib/prisma-client";
import { AppError, HttpCode } from "../AppError";
import { BaseConstructorProps, PdfDocument } from "./PdfDocument";
import fileUpload from "express-fileupload";
import { signPdf } from "../../lib/pdf-lib";

interface ConstructorProps extends BaseConstructorProps {
    scoutId: string
    familiarId: string
    cicloActividades: string
}

interface Data {
    scoutId: string,
    familiarId: string
    familiar: Familiar
    scout: Scout
    cicloActividades: string
    signature: fileUpload.UploadedFile
    theme: "light" | "dark"
}

export class AutorizacionUsoImagen extends PdfDocument {
    data: Data

    constructor({ scoutId, familiarId, cicloActividades, data, ...props }: ConstructorProps) {
        super(props)
        this.data = { scoutId, familiarId, cicloActividades, ...data }
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
            ...this.data,
            familiar,
            scout: familiar.padreScout[0].scout
        }
    }
    mapData() {
        const { cicloActividades } = this.data
        const { nombre, apellido, dni, direccion } = this.data.familiar!
        const { nombre: nombreScout, apellido: apellidoScout, dni: dniScout } = this.data.scout!

        console.log({ cicloActividades });

        return {
            "Nombre": `${apellido} ${nombre}`,
            "Domicilio": direccion,
            "Nombre_scout": `${apellidoScout} ${nombreScout}`,
            "Nombre_scout_2": `${apellidoScout} ${nombreScout}`,
            "DNI_menor": dniScout,
            "DNI": dni,
            "Firma_aclaracion": `${apellido} ${nombre}`,
            "Fecha_a#C3#B1o_permiso": cicloActividades
        }
    }

    get uploadFolder() {
        return `${this.data?.scoutId}/`
    }

    async sign() {
        const pdfBytes = await signPdf(
            {
                signature: this.data.signature,
                inputFile: this.buffer,
                options: {
                    position: {
                        x: 330,
                        y: 290,
                    },
                    rotate: 90,
                    scale: 0.05,
                    negate: this.data.theme === "dark"
                }
            }
        )

        this.buffer = Buffer.from(pdfBytes)
    }

}
