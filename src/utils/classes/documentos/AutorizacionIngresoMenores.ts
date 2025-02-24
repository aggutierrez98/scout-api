import { Familiar, Scout } from "@prisma/client";
import { prismaClient } from "../../lib/prisma-client";
import { AppError, HttpCode } from "../AppError";
import { BaseConstructorProps, PdfDocument } from "./PdfDocument";
import { RelacionFamiliarType } from "../../../types";

const datosGrupo = JSON.parse(process.env.DATOS_GRUPO || "")
const PARTIDO_DOMICILIO = "Tres de febrero"

interface ConstructorProps extends BaseConstructorProps {
    scoutId: string
    familiarId: string
}

interface Data {
    scoutId?: string,
    familiarId?: string
    familiar?: Familiar
    scout?: Scout
    relacion?: RelacionFamiliarType,
}

export class AutorizacionIngresoMenores extends PdfDocument {
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
            ...this.data,
            familiar,
            scout: familiar.padreScout[0].scout,
            relacion: familiar.padreScout[0].relacion as RelacionFamiliarType
        }
    }
    mapData() {
        const { scout, familiar, relacion } = this.data
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
            'Fecha_actual_a#C3#B1o': anoFechaActual
        }
    }

    get uploadFolder() {
        return `${this.data?.scoutId}/`
    }

}
