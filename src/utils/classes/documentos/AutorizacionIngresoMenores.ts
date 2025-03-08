import { Familiar, Scout } from "@prisma/client";
import { prismaClient } from "../../lib/prisma-client";
import { AppError, HttpCode } from "../AppError";
import { BaseConstructorProps, PdfDocument } from "./PdfDocument";
import { RelacionFamiliarType } from "../../../types";
import { signPdf } from "../../lib/pdf-lib";
import fileUpload from 'express-fileupload';

const datosGrupo = JSON.parse(process.env.DATOS_GRUPO || "")
const PARTIDO_DOMICILIO = "Tres de febrero"

interface ConstructorProps extends BaseConstructorProps {
    scoutId: string
    familiarId: string
    aclaraciones?: string
}

interface Data {
    scoutId: string,
    familiarId: string
    familiar: Familiar
    signature: fileUpload.UploadedFile
    theme: "light" | "dark"
    scout: Scout
    relacion: RelacionFamiliarType,
    aclaraciones?: string,
}

export class AutorizacionIngresoMenores extends PdfDocument {
    data: Data

    constructor({ scoutId, familiarId, aclaraciones, data, ...props }: ConstructorProps) {
        super(props)
        this.data = { scoutId, familiarId, aclaraciones, ...data }
        this.options = {
            fontColor: "#000",
            fontSize: 8,
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
            scout: familiar.padreScout[0].scout,
            relacion: familiar.padreScout[0].relacion as RelacionFamiliarType
        }
    }
    mapData() {
        const { scout, familiar, relacion, aclaraciones } = this.data
        const { nombre, apellido, dni, direccion, localidad, telefono, fechaNacimiento: fechaNacimientoFamiliar, nacionalidad, provincia } = familiar!
        const { nombre: nombreScout, apellido: apellidoScout, fechaNacimiento, dni: dniScout, direccion: direccionScout, localidad: localidadScout, nacionalidad: nacionalidadScout } = scout!
        const nombreApellidoFamiliar = `${apellido} ${nombre}`
        const nombreApellidoScout = `${apellidoScout} ${nombreScout}`
        const [diaNacimientoFamiliar, mesNacimientoFamiliar, anoNacimientoFamiliar] = fechaNacimientoFamiliar.toLocaleDateString().split("/")
        const [diaNacimientoScout, mesNacimientoScout, anoNacimientoScout] = fechaNacimiento.toLocaleDateString().split("/")
        const [diaFechaActual, mesFechaActual, anoFechaActual] = new Date().toLocaleDateString().split("/")
        const domicilioFamiliar = `${direccion}, ${localidad}`
        const domicilioScout = `${direccionScout}, ${localidadScout}`

        return {
            'Localidad': localidad,
            'Partido': PARTIDO_DOMICILIO,
            'Provincia': provincia || "",
            'Nombre': nombreApellidoFamiliar,
            'Nacionalidad': nacionalidad || "",
            'Telefono': telefono || "",
            'DNI': dni,
            'Domicilio': domicilioFamiliar,
            'Caracter_familiar': relacion?.toString() || "",
            'Fecha_nacimiento_dia': diaNacimientoFamiliar,
            'Fecha_nacimiento_mes': mesNacimientoFamiliar,
            'Fecha_nacimiento_a#C3#B1o': anoNacimientoFamiliar,
            'DNI_menor': dniScout,
            'Nacionalidad_menor': nacionalidadScout || "",
            'Nombre_menor': nombreApellidoScout,
            'Fecha_nacimiento_dia_menor': diaNacimientoScout,
            'Fecha_nacimiento_mes_menor': mesNacimientoScout,
            'Fecha_nacimiento_a#C3#B1o_menor': anoNacimientoScout,
            'Domicilio_menor': domicilioScout,
            'GS_Numero': datosGrupo.numero,
            'GS_nombre': datosGrupo.nombre,
            'GS_numero_distrito': datosGrupo.distrito,
            'GS_numero_zona': datosGrupo.zona,
            'Fecha_actual_dia': diaFechaActual,
            'Fecha_actual_mes': mesFechaActual,
            'Fecha_actual_a#C3#B1o': anoFechaActual,
            "Aclaraciones_1": aclaraciones?.slice(0, 40) || "",
            "Aclaraciones_2": aclaraciones?.slice(40) || "",
        }
    }

    get uploadFolder() {
        return `${this.data?.scoutId}/`
    }


    async sign() {

        let signedPdfBytes = await signPdf(
            {
                signature: this.data.signature || "",
                inputFile: this.buffer,
                options: {
                    position: {
                        x: 295,
                        y: 422,
                    },
                    rotate: 90,
                    scale: .035,
                    negate: this.data.theme === "dark"
                }
            }
        )

        // Se vuelven a firmar las aclaraciones
        if (this.data.aclaraciones) {
            signedPdfBytes = await signPdf(
                {
                    signature: this.data.signature || "",
                    inputFile: Buffer.from(signedPdfBytes),
                    options: {
                        position: {
                            x: 295,
                            y: 342,
                        },
                        scale: 0.035,
                        rotate: 90,
                        negate: this.data.theme === "dark"
                    }
                }
            )
        }

        this.buffer = Buffer.from(signedPdfBytes)
    }

}
