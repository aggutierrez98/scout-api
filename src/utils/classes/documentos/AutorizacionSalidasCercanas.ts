import { Familiar, Scout } from "@prisma/client";
import { prismaClient } from "../../lib/prisma-client";
import { AppError, HttpCode } from "../AppError";
import { BaseConstructorProps, PdfDocument } from "./PdfDocument";
import { RelacionFamiliarType } from "../../../types";
import { signPdf } from "../../lib/pdf-lib";
import fileUpload from "express-fileupload";
import { SecretsManager } from "../SecretsManager";

const datosGrupo = SecretsManager.getInstance().getDatosGrupo();
const PARTIDO_DOMICILIO = "Tres de febrero"

interface ConstructorProps extends BaseConstructorProps {
    scoutId?: string
    familiarId?: string,
    cicloActividades?: string
    rangoDistanciaPermiso?: string
}

interface Data {
    scoutId: string,
    familiarId: string
    signature: fileUpload.UploadedFile
    theme: "light" | "dark"
    familiar: Familiar
    scout: Scout
    relacion: RelacionFamiliarType,
    cicloActividades: string
    rangoDistanciaPermiso: string
}

export class AutorizacionSalidasCercanas extends PdfDocument {
    data: Data

    constructor({ scoutId, familiarId, cicloActividades, rangoDistanciaPermiso, data, ...props }: ConstructorProps) {
        super(props)
        this.data = { scoutId, familiarId, cicloActividades, rangoDistanciaPermiso, ...data }
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
        const { scout, familiar, relacion, cicloActividades, rangoDistanciaPermiso } = this.data
        const { nombre, apellido, dni, direccion, localidad, telefono, fechaNacimiento: fechaNacimientoFamiliar, nacionalidad } = familiar!
        const { nombre: nombreScout, apellido: apellidoScout, fechaNacimiento, dni: dniScout, direccion: direccionScout, localidad: localidadScout, nacionalidad: nacionalidadScout, provincia } = scout!
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
            'Fecha_a#C3#B1o_permiso': cicloActividades || "",
            'Permiso_rango': rangoDistanciaPermiso || ""
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
                        y: 330,
                    },
                    rotate: 90,
                    negate: this.data.theme === "dark"
                },
                returnBase64: !!returnBase64
            }
        )

        if (returnBase64) return pdfBytes as string
        this.buffer = Buffer.from(pdfBytes)
    }
}
