import { Familiar, Scout } from "@prisma/client";
import { prismaClient } from "../../lib/prisma-client";
import { AppError, HttpCode } from "../AppError";
import { BaseConstructorProps, PdfDocument } from "./PdfDocument";
import { RelacionFamiliarType } from "../../../types";
import { separarCalleYNumero } from "../../helpers/getDireccionData";

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
    retiroData?: {
        solo: boolean,
        personas?: {
            nombre: string,
            apellido: string,
            dni: string,
            parentesco: string
        }[]
    }
}

export class AutorizacionRetiro extends PdfDocument {
    data: Data = {}

    constructor({ scoutId, familiarId, ...props }: ConstructorProps) {
        super(props)
        this.data = { scoutId, familiarId }
        this.options = {
            fontColor: "#000",
            fontSize: 10,
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
            scout: familiar.padreScout[0].scout,
            relacion: familiar.padreScout[0].relacion as RelacionFamiliarType
        }
    }
    mapData() {
        const { scout, familiar, relacion, retiroData } = this.data
        const { nombre, apellido, dni, direccion, localidad } = familiar!
        const { nombre: nombreScout, apellido: apellidoScout, fechaNacimiento, rama } = scout!
        const nombreApellidoFamiliar = `${apellido} ${nombre}`
        const nombreApellidoScout = `${apellidoScout} ${nombreScout}`
        const [diaNacimiento, mesNacimiento, anoNacimiento] = fechaNacimiento.toLocaleDateString().split("/")
        const { calle, numero } = separarCalleYNumero(direccion)

        const personasData = retiroData?.personas?.reduce((acc, persona, index) => ({
            ...acc,
            [`Nombre_apellido_persona_${index + 1}`]: `${persona.apellido} ${persona.nombre}`,
            [`Parentesco_persona_${index + 1}`]: persona.parentesco,
            [`DNI_persona_${index + 1}`]: persona.dni,
        }), {})

        return {
            ...personasData,
            'Nombre_apellido_scout': nombreApellidoScout,
            'Domicilio_scout_calle': calle,
            'Domicilio_scout_numero': numero,
            'Domicilio_scout_localidad': localidad,
            'Rama_scout': rama?.toString() || "",
            'Fecha_nacimiento_scout_dia': diaNacimiento,
            'Fecha_nacimiento_scout_mes': mesNacimiento,
            'Fecha_nacimiento_scout_a#C3#B1o': anoNacimiento,
            'Check_retiro_personas': retiroData?.personas?.length ? "" : "X",
            'Check_retiro_solo': retiroData?.solo ? "X" : "",
            'Nombre_apellido_scout_2': nombreApellidoScout,
            'Firma_aclaracion': nombreApellidoFamiliar,
            'Firma_DNI': dni,
            'Firma_Parentesco': relacion?.toString() || "",
        }
    }

}
