import { Familiar, Scout } from "@prisma/client";
import { prismaClient } from "../../lib/prisma-client";
import { AppError, HttpCode } from "../AppError";
import { BaseConstructorProps, PdfDocument } from "./PdfDocument";
import { RelacionFamiliarType, TipoEventoType } from "../../../types";
import { signPdf, StraighThroughLine } from "../../lib/pdf-lib";
import fileUpload from "express-fileupload";

const datosGrupo = JSON.parse(process.env.DATOS_GRUPO || "")
const PARTIDO_DOMICILIO = "Tres de febrero"

const LINES = {
    SALIDA: {
        start: {
            x: 70,
            y: 528,
        },
        end: {
            x: 110,
            y: 525,
        },
    },
    ACANTONAMIENTO: {
        start: {
            x: 130,
            y: 528,
        },
        end: {
            x: 225,
            y: 525,
        },
    },
    CAMPAMENTO: {
        start: {
            x: 235,
            y: 528,
        },
        end: {
            x: 305,
            y: 525,
        },
    },
}

interface ConstructorProps extends BaseConstructorProps {
    scoutId?: string
    familiarId?: string,
    fechaEventoComienzo?: Date
    fechaEventoFin?: Date
    lugarEvento?: string
    tipoEvento?: TipoEventoType
}

interface Data {
    scoutId: string,
    familiarId: string
    signature: fileUpload.UploadedFile
    theme: "light" | "dark"
    familiar: Familiar
    scout: Scout
    relacion: RelacionFamiliarType,
    fechaEventoComienzo: Date
    fechaEventoFin: Date
    lugarEvento: string
    tipoEvento: TipoEventoType
}


export class AutorizacionEventos extends PdfDocument {
    data: Data

    constructor({ scoutId, familiarId, lugarEvento, fechaEventoComienzo, fechaEventoFin, tipoEvento, data, ...props }: ConstructorProps) {
        super(props)
        this.data = { scoutId, familiarId, lugarEvento, fechaEventoComienzo, fechaEventoFin, tipoEvento, ...data }
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
            scout: familiar.padreScout[0].scout,
            relacion: familiar.padreScout[0].relacion as RelacionFamiliarType
        }
    }
    mapData() {
        const { scout, familiar, relacion, lugarEvento, fechaEventoComienzo, fechaEventoFin, tipoEvento } = this.data
        const { nombre, apellido, dni, direccion, localidad, telefono, fechaNacimiento: fechaNacimientoFamiliar, nacionalidad } = familiar!
        const { nombre: nombreScout, apellido: apellidoScout, fechaNacimiento, dni: dniScout, direccion: direccionScout, localidad: localidadScout, nacionalidad: nacionalidadScout, provincia } = scout!
        const nombreApellidoFamiliar = `${apellido} ${nombre}`
        const nombreApellidoScout = `${apellidoScout} ${nombreScout}`
        const [diaNacimientoFamiliar, mesNacimientoFamiliar, anoNacimientoFamiliar] = fechaNacimientoFamiliar.toLocaleDateString().split("/")
        const [diaNacimientoScout, mesNacimientoScout, anoNacimientoScout] = fechaNacimiento.toLocaleDateString().split("/")
        const [diaFechaActual, mesFechaActual, anoFechaActual] = new Date().toLocaleDateString().split("/")
        const domicilioFamiliar = `${direccion}, ${localidad}`
        const domicilioScout = `${direccionScout}, ${localidadScout}`

        const linesToStrikeTrough: StraighThroughLine[] = []
        for (const key in LINES) {
            //@ts-ignore
            if (tipoEvento !== key) linesToStrikeTrough.push(LINES[key])
        }

        return {
            'Localidad': localidad,
            'Partido': PARTIDO_DOMICILIO,
            'Provincia': provincia || "",
            'Nombre': nombreApellidoFamiliar || "",
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
            'Domicilio_menor': domicilioScout,
            'GS_Numero': datosGrupo.numero,
            'GS_nombre': datosGrupo.nombre,
            'GS_numero_distrito': datosGrupo.distrito,
            'GS_numero_zona': datosGrupo.zona,
            'Fecha_actual_dia': diaFechaActual,
            'Fecha_actual_mes': mesFechaActual,
            'Fecha_actual_a#C3#B1o': anoFechaActual,
            'Fecha_nacimiento_menor_dia': diaNacimientoScout,
            'Fecha_nacimiento_menor_mes': mesNacimientoScout,
            'Fecha_nacimiento_menor_a#C3#B1o': anoNacimientoScout,
            "Feche_evento_desde": fechaEventoComienzo.toLocaleDateString(),
            "Feche_evento_hasta": fechaEventoFin.toLocaleDateString(),
            "Lugar_evento": lugarEvento,
            "ST-Tipo_salida": linesToStrikeTrough
        }
    }


    get uploadFolder() {
        return `${this.data.scoutId}/`
    }

    async sign({ returnBase64 }: { returnBase64?: boolean }) {
        const pdfBytes = await signPdf(
            {
                signature: this.data.signature,
                inputFile: this.buffer,
                options: {
                    position: {
                        x: 275,
                        y: 318,
                    },
                    rotate: 90,
                    scale: 0.04,
                    negate: this.data.theme === "dark"
                },
                returnBase64: !!returnBase64
            }
        )

        if (returnBase64) return pdfBytes as string
        this.buffer = Buffer.from(pdfBytes)
    }

}
